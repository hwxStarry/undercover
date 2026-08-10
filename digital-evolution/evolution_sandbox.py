#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║           自下而上 · 数字演化沙盒  —  Artificial Life Evolution Sandbox       ║
║                     Bottom-Up · Emergent Digital Life                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

运行说明
────────
  直接运行:  python3 evolution_sandbox.py
  依赖:      仅 Python 3.7+ 标准库，无需安装任何第三方包
  平台:      macOS / Linux（Windows 下部分终端显示可能异常，但仍可运行）

参数调优建议
────────────
  · SANDBOX_SIZE:      沙盒格子数。越大 → 种群上限越高，但计算越慢。
                        建议 3000~10000，默认 5000。
  · MAX_TIME_SLICES:   每轮总算力。越大 → 种群演化越快，但筛选压力越小。
                        建议 200~500，默认 300。
  · MUTATION_RATE:     每次复制时的突变概率。太低 → 演化停滞；太高 → 种群崩溃。
                        建议 0.005~0.05，默认 0.02。
  · DISTURBANCE_INTERVAL: 环境扰动间隔。越小 → 环境越不稳定，筛选越严苛。
                        建议 30~100，默认 50。
  · DISTURBANCE_STRENGTH: 每次扰动清零的格子数。建议 2~10，默认 5。
  · INITIAL_SEEDS:     初始投放的种子数量。建议 1~10，默认 3。

  调优思路: 先以小参数运行，观察种群能否稳定增长。若种群崩溃，降低突变率；
  若演化停滞（全部为同一种），增大突变率或扰动频率。

交互控制
────────
  运行中可按以下键控制:
    p  — 暂停 / 继续
    s  — 保存当前种群快照到 snapshot_*.json
    i  — 查看当前优势个体（Top 1）的完整指令序列
    d  — 手动触发一次环境扰动
    q  — 退出模拟

核心设计理念
────────────
  本模拟不是"设计生命"，而是"设定规则，让生命自发涌现"。
  沙盒只提供: 存储空间（物质）、算力时间片（能量）、随机突变（变异源）、
  资源竞争（自然选择）。所有复杂行为必须是底层规则涌现的结果。

可扩展迭代方向
──────────────
  1. 引入指令间的"能量代谢"——每条指令消耗不同能量，让效率维度更丰富
  2. 增加"捕食"指令——让有机体可以读取/修改其他有机体的代码
  3. 引入"有性繁殖"——两个有机体交叉重组指令序列
  4. 增加空间维度——有机体在 2D 网格中移动，只能与邻居交互
  5. 引入"基因调控"——部分指令影响其他指令的执行概率
  6. 添加"生态位"——不同资源类型，让多样化共存成为可能
  7. 引入"共生"机制——有机体可以共享算力
  8. 可视化——用 matplotlib 或 pygame 做图形化演化曲线
  9. 指令集进化——允许指令集本身在演化中变化（元演化）
  10. 多层选择——在个体选择和群体选择之间引入中间层级
"""

import random
import sys
import os
import re
import time
import json
import select
import signal
import tty
import termios
from datetime import datetime
from collections import defaultdict
from typing import List, Optional, Tuple, Dict, Any

# ============================================================
#  可配置参数 —— 修改这些常量来调整演化环境
# ============================================================

SANDBOX_SIZE: int = 5000          # 沙盒总格子数（数字世界的"物质"总量）
MAX_TIME_SLICES: int = 300        # 每轮总算力时间片（数字世界的"能量"总量）
MUTATION_RATE: float = 0.02       # 每次复制时的突变概率（0.0 ~ 1.0）
DISTURBANCE_INTERVAL: int = 50    # 环境扰动间隔（每隔多少轮扰动一次）
DISTURBANCE_STRENGTH: int = 5     # 每次扰动随机清零的格子数
MAX_STEPS_PER_ORG: int = 20       # 单个有机体每轮最大执行步数
INITIAL_SEEDS: int = 3            # 初始投放的种子数量
RANDOM_SEED: Optional[int] = None # 随机种子（None = 真随机，设整数可复现）
SNAPSHOT_DIR: str = ""            # 快照保存目录（空 = 当前目录）

# ============================================================
#  指令集定义 —— 数字生命的"汇编语言"
#  每个指令占 1 个格子(opcode)，部分指令需要额外 1 格存放操作数
# ============================================================

# 单格指令（仅 opcode）
NOP  = 0   # 空操作 —— 什么都不做，消耗 1 步
REPL = 1   # 自复制 —— 触发复制自身到空白区域（1 步）
HLT  = 2   # 停机 —— 结束本轮执行
INC  = 3   # 累加器 +1
DEC  = 4   # 累加器 -1

# 双格指令（opcode + operand）
SET  = 5   # 设置累加器 = 操作数值
ADD  = 6   # 累加器 += 操作数值
SUB  = 7   # 累加器 -= 操作数值
JMP  = 8   # 无条件跳转：IP += 操作数（相对偏移）
JZ   = 9   # 条件跳转：如果 ACC == 0，IP += 操作数
JNZ  = 10  # 条件跳转：如果 ACC != 0，IP += 操作数
READ = 11  # 读取：ACC = 当前有机体内部偏移[操作数]处的值
WRITE= 12  # 写入：当前有机体内部偏移[操作数]处 = ACC

# 指令元数据: (名称, 是否需要操作数, 执行消耗步数)
INSTRUCTION_SET = {
    NOP:  ("NOP",  False, 1),
    REPL: ("REPL", False, 1),
    HLT:  ("HLT",  False, 1),
    INC:  ("INC",  False, 1),
    DEC:  ("DEC",  False, 1),
    SET:  ("SET",  True,  2),
    ADD:  ("ADD",  True,  2),
    SUB:  ("SUB",  True,  2),
    JMP:  ("JMP",  True,  1),
    JZ:   ("JZ",   True,  1),
    JNZ:  ("JNZ",  True,  1),
    READ: ("READ", True,  2),
    WRITE:("WRITE",True,  2),
}

# 所有有效的 opcode 列表（用于随机突变）
ALL_OPCODES = list(INSTRUCTION_SET.keys())

# 需要操作数的指令集合
OPCODES_WITH_OPERAND = {op for op, (_, needs_op, _) in INSTRUCTION_SET.items() if needs_op}

# 单格指令集合
SINGLE_CELL_OPCODES = {op for op, (_, needs_op, _) in INSTRUCTION_SET.items() if not needs_op}


def instruction_size(opcode: int) -> int:
    """返回指令占用的格子数（1 或 2）"""
    return 2 if opcode in OPCODES_WITH_OPERAND else 1


def instruction_name(opcode: int) -> str:
    """返回指令的人类可读名称"""
    return INSTRUCTION_SET.get(opcode, ("???", False, 1))[0]


# ============================================================
#  有机体（Organism） —— 数字生命个体
# ============================================================

# 有机体头部结构（在沙盒格子中的偏移）
HEADER_MAGIC    = 0   # 魔数，标识有效有机体 (0xB007)
HEADER_LENGTH   = 1   # 有机体总长度（含头部）
HEADER_GEN      = 2   # 代数（第几代）
HEADER_AGE      = 3   # 年龄（存活了多少轮）
HEADER_LAST_ACT = 4   # 上次活跃的轮次
HEADER_REPL_CNT = 5   # 累计复制次数
HEADER_SIZE     = 6   # 头部总格数
HEADER_MAGIC_VAL= 0xB007  # 魔数值

# 指令区从头部之后开始
INSTRUCTION_OFFSET = HEADER_SIZE


class Organism:
    """
    数字生命个体。
    每个有机体在沙盒中占据一段连续的格子:
      [MAGIC, LENGTH, GENERATION, AGE, LAST_ACTIVE, REPL_COUNT, instr1, instr2, ...]
    """

    __slots__ = ('start', 'length', 'generation', 'age',
                 'last_active', 'replicate_count',
                 'ip', 'acc', 'steps_this_cycle', 'alive')

    def __init__(self, start: int, length: int, generation: int = 0):
        self.start = start              # 在沙盒中的起始位置
        self.length = length            # 总长度（含头部）
        self.generation = generation    # 代数
        self.age = 0                    # 存活轮数
        self.last_active = 0            # 上次活跃轮次
        self.replicate_count = 0        # 累计复制次数
        # 运行时状态（不存储在沙盒中）
        self.ip = INSTRUCTION_OFFSET    # 指令指针（相对偏移）
        self.acc = 0                    # 累加器
        self.steps_this_cycle = 0       # 本轮已执行步数
        self.alive = True               # 是否存活

    def write_header(self, sandbox: List[int]) -> None:
        """将头部信息写入沙盒"""
        cells = sandbox
        s = self.start
        cells[s + HEADER_MAGIC]    = HEADER_MAGIC_VAL
        cells[s + HEADER_LENGTH]   = self.length
        cells[s + HEADER_GEN]      = self.generation
        cells[s + HEADER_AGE]      = self.age
        cells[s + HEADER_LAST_ACT] = self.last_active
        cells[s + HEADER_REPL_CNT] = self.replicate_count

    def read_header(self, sandbox: List[int]) -> None:
        """从沙盒读取头部信息"""
        cells = sandbox
        s = self.start
        self.length          = cells[s + HEADER_LENGTH]
        self.generation      = cells[s + HEADER_GEN]
        self.age             = cells[s + HEADER_AGE]
        self.last_active     = cells[s + HEADER_LAST_ACT]
        self.replicate_count = cells[s + HEADER_REPL_CNT]

    def get_instructions(self, sandbox: List[int]) -> List[int]:
        """获取指令序列（不含头部）"""
        return sandbox[self.start + INSTRUCTION_OFFSET : self.start + self.length]

    def instruction_at(self, sandbox: List[int], offset: int) -> int:
        """读取指令区偏移 offset 处的值"""
        pos = self.start + offset
        if self.start <= pos < self.start + self.length:
            return sandbox[pos]
        return 0

    def compute_fitness(self) -> float:
        """
        计算适应度（用于自然选择）。
        适应度 = 活跃度 / 长度 —— 越短小精悍、越活跃的个体，适应度越高。
        这是自然选择的核心：占用资源少、复制效率高的个体更受青睐。
        """
        if self.length <= HEADER_SIZE:
            return 0.0
        instr_len = self.length - HEADER_SIZE
        # 基础效率: 1 / 指令长度（越短越好）
        efficiency = 1.0 / max(instr_len, 1)
        # 活跃度奖励: 最近活跃的个体加分
        activity_bonus = min(self.replicate_count / max(self.age, 1), 1.0)
        return efficiency * (1.0 + activity_bonus)

    def instruction_display(self, sandbox: List[int]) -> str:
        """返回指令序列的人类可读表示"""
        instrs = self.get_instructions(sandbox)
        parts = []
        i = 0
        while i < len(instrs):
            op = instrs[i]
            name = instruction_name(op)
            if op in OPCODES_WITH_OPERAND and i + 1 < len(instrs):
                parts.append(f"{name}({instrs[i+1]})")
                i += 2
            else:
                parts.append(name)
                i += 1
        return " ".join(parts)

    def instruction_signature(self, sandbox: List[int]) -> str:
        """
        返回指令序列的"签名"（用于物种分类）。
        将指令序列压缩为简短字符串，忽略操作数差异（只比较结构）。
        """
        instrs = self.get_instructions(sandbox)
        sig = []
        i = 0
        while i < len(instrs):
            op = instrs[i]
            sig.append(str(op))
            if op in OPCODES_WITH_OPERAND and i + 1 < len(instrs):
                i += 2
            else:
                i += 1
        return ":".join(sig)


# ============================================================
#  沙盒环境（Sandbox） —— 封闭的数字原始海洋
# ============================================================

class Sandbox:
    """
    封闭的数字沙盒环境。
    - 总存储格子数固定（物质有限）
    - 总算力时间片固定（能量有限）
    - 指令按顺序执行，超出资源占用会被终止
    - 定期环境扰动，模拟自然变化
    """

    def __init__(self, size: int = SANDBOX_SIZE, max_slices: int = MAX_TIME_SLICES):
        self.size = size
        self.max_slices = max_slices
        self.cells = [0] * size           # 沙盒格子：0 = 空闲
        self.organisms: List[Organism] = []  # 当前存活的有机体列表
        self.cycle = 0                    # 当前轮次
        self.total_born = 0              # 累计诞生数
        self.total_died = 0              # 累计死亡数
        self.total_replications = 0      # 累计复制次数
        self.log_messages: List[str] = [] # 日志消息
        self.used_cells = 0              # 已占用格子数

    # ── 空间管理 ──────────────────────────────────────────

    def find_free_space(self, length: int) -> Optional[int]:
        """
        在沙盒中寻找连续空闲空间。
        使用首次适配策略（first-fit），找到第一个足够大的连续空闲块。
        返回起始位置，若无足够空间返回 None。
        """
        needed = length
        run_start = -1
        run_len = 0

        for i in range(self.size):
            if self.cells[i] == 0:
                if run_start == -1:
                    run_start = i
                run_len += 1
                if run_len >= needed:
                    return run_start
            else:
                run_start = -1
                run_len = 0
        return None

    def count_free_cells(self) -> int:
        """统计空闲格子数"""
        return self.cells.count(0)

    def is_occupied(self, start: int, length: int) -> bool:
        """检查一段区域是否被占用（任何非零格子）"""
        if start < 0 or start + length > self.size:
            return True
        return any(self.cells[start:start + length])

    # ── 有机体管理 ────────────────────────────────────────

    def allocate_organism(self, start: int, length: int, generation: int = 0) -> Organism:
        """在指定位置分配一个新有机体"""
        org = Organism(start, length, generation)
        self.organisms.append(org)
        self.used_cells += length
        self.total_born += 1
        return org

    def deallocate_organism(self, org: Organism) -> None:
        """释放有机体占用的空间（清零格子）"""
        for i in range(org.start, org.start + org.length):
            self.cells[i] = 0
        self.organisms.remove(org)
        self.used_cells -= org.length
        self.total_died += 1
        org.alive = False

    def write_organism(self, org: Organism, instructions: List[int]) -> None:
        """将有机体的头部和指令写入沙盒"""
        # 写入头部
        org.write_header(self.cells)
        # 写入指令
        for i, instr in enumerate(instructions):
            pos = org.start + INSTRUCTION_OFFSET + i
            if pos < org.start + org.length:
                self.cells[pos] = instr

    def validate_organism(self, org: Organism) -> bool:
        """
        验证有机体是否仍然有效。
        检查魔数是否完整，防止有机体数据被其他有机体覆盖。
        """
        if org.start < 0 or org.start + org.length > self.size:
            return False
        return self.cells[org.start + HEADER_MAGIC] == HEADER_MAGIC_VAL

    # ── 种子投放 ──────────────────────────────────────────

    def seed_initial_life(self, count: int = INITIAL_SEEDS) -> None:
        """
        投放初始生命种子。
        种子是一个极简的自复制指令序列: [REPL, HLT]
        —— 唯一功能是触发复制自身到空白格子。
        这是整个数字生态的"始祖"，所有后续多样性都从它变异而来。
        """
        # 极简自复制种子: 复制自己，然后停机
        seed_instructions = [REPL, HLT]
        org_length = HEADER_SIZE + len(seed_instructions)

        for _ in range(count):
            pos = self.find_free_space(org_length)
            if pos is None:
                self._log("⚠ 沙盒空间不足，无法投放更多种子")
                break

            org = self.allocate_organism(pos, org_length, generation=0)
            self.write_organism(org, seed_instructions)
            self._log(f"🌱 投放种子 #{org.start} (长度={org.length})")

    # ── 复制与突变 ────────────────────────────────────────

    def replicate(self, parent: Organism) -> Optional[Organism]:
        """
        执行自复制操作。
        1. 读取父代指令序列
        2. 在复制过程中对每个指令施加随机突变
        3. 在沙盒中寻找空闲空间写入子代
        4. 返回子代有机体
        """
        parent_instructions = parent.get_instructions(self.cells)
        child_instructions = self._mutate_instructions(parent_instructions)

        child_length = HEADER_SIZE + len(child_instructions)
        child_pos = self.find_free_space(child_length)

        if child_pos is None:
            # 无空闲空间，复制失败 —— 这是环境承载力的体现
            return None

        child = self.allocate_organism(child_pos, child_length,
                                       generation=parent.generation + 1)
        self.write_organism(child, child_instructions)

        parent.replicate_count += 1
        self.total_replications += 1

        return child

    def _mutate_instructions(self, instructions: List[int]) -> List[int]:
        """
        对指令序列施加随机突变。
        突变类型（等概率）:
          - 替换: 将某个 opcode 替换为随机 opcode
          - 插入: 在某个位置插入随机指令
          - 删除: 删除某个指令
          - 操作数突变: 对双格指令的操作数做随机偏移

        突变完全随机，无方向 —— 大部分有害，少量中性，极少量有利。
        这是演化的核心驱动力。
        """
        mutated = list(instructions)
        i = 0
        while i < len(mutated):
            if random.random() < MUTATION_RATE:
                mutation_type = random.choice(['replace', 'insert', 'delete', 'opshift'])
                op = mutated[i]

                if mutation_type == 'replace':
                    # 替换 opcode 为随机指令
                    new_op = random.choice(ALL_OPCODES)
                    mutated[i] = new_op
                    # 如果新指令不需要操作数但原来有，删除操作数
                    if new_op not in OPCODES_WITH_OPERAND and op in OPCODES_WITH_OPERAND:
                        if i + 1 < len(mutated):
                            mutated.pop(i + 1)
                    # 如果新指令需要操作数但原来没有，插入随机操作数
                    if new_op in OPCODES_WITH_OPERAND and op not in OPCODES_WITH_OPERAND:
                        mutated.insert(i + 1, random.randint(-10, 10))

                elif mutation_type == 'insert':
                    # 在当前位置插入一条随机指令
                    new_op = random.choice(ALL_OPCODES)
                    mutated.insert(i, new_op)
                    if new_op in OPCODES_WITH_OPERAND:
                        mutated.insert(i + 1, random.randint(-10, 10))

                elif mutation_type == 'delete':
                    # 删除当前指令
                    size = instruction_size(op)
                    for _ in range(size):
                        if i < len(mutated):
                            mutated.pop(i)
                    i -= 1  # 补偿 i 的自增

                elif mutation_type == 'opshift':
                    # 操作数随机偏移（仅对双格指令有效）
                    if op in OPCODES_WITH_OPERAND and i + 1 < len(mutated):
                        shift = random.choice([-3, -2, -1, 1, 2, 3])
                        mutated[i + 1] = mutated[i + 1] + shift

            # 根据当前指令大小前进
            if 0 <= i < len(mutated):
                i += instruction_size(mutated[i])
            else:
                break

        # 确保至少有一条指令
        if len(mutated) == 0:
            mutated = [NOP]

        return mutated

    # ── 执行引擎 ──────────────────────────────────────────

    def execute_cycle(self) -> None:
        """
        执行一轮模拟。
        1. 根据适应度分配算力时间片
        2. 按分配执行各有机体
        3. 处理复制产生的子代
        4. 应用自然选择
        5. 环境扰动
        """
        self.cycle += 1

        # 更新所有有机体的年龄
        for org in self.organisms:
            org.age += 1

        # 1. 分配算力时间片 —— 效率越高，获得越多执行机会
        new_children: List[Organism] = []

        if self.organisms:
            self._allocate_time_slices()
            # 2. 执行有机体
            for org in self.organisms:
                child = self._execute_organism(org)
                if child is not None:
                    new_children.append(child)

        # 3. 将新子代加入种群
        self.organisms.extend(new_children)

        # 4. 自然选择 —— 空间占满后淘汰劣势个体
        self._natural_selection()

        # 5. 环境扰动
        if self.cycle % DISTURBANCE_INTERVAL == 0:
            self._environmental_disturbance()

    def _allocate_time_slices(self) -> None:
        """
        按适应度分配算力时间片。
        适应度越高的有机体，分配到的执行步数越多。
        这是"复制效率越高、占用资源越少的个体，获得越多执行机会"的具体实现。
        """
        # 计算每个有机体的适应度
        fitnesses = [org.compute_fitness() for org in self.organisms]
        total_fitness = sum(fitnesses)

        if total_fitness <= 0:
            # 所有个体适应度为 0，平均分配
            per_org = max(1, self.max_slices // len(self.organisms))
            for org in self.organisms:
                org.steps_this_cycle = min(per_org, MAX_STEPS_PER_ORG)
            return

        # 按比例分配
        remaining = self.max_slices
        for org, fit in zip(self.organisms, fitnesses):
            share = int(self.max_slices * (fit / total_fitness))
            share = max(1, min(share, MAX_STEPS_PER_ORG))  # 最少 1 步，最多上限
            org.steps_this_cycle = share

    def _execute_organism(self, org: Organism) -> Optional[Organism]:
        """
        执行一个有机体的指令序列。
        返回: 如果触发了复制，返回子代有机体；否则返回 None。

        执行规则:
        - 指令按顺序执行
        - 超出指令区边界则自动停机（边界保护）
        - 超出本轮分配步数则暂停
        - 数据读写有边界检查
        """
        org.ip = INSTRUCTION_OFFSET
        org.acc = 0
        org.last_active = self.cycle
        steps = 0
        child = None

        while steps < org.steps_this_cycle and child is None:
            if org.ip < INSTRUCTION_OFFSET or org.ip >= org.length:
                break  # 超出指令区边界，终止

            opcode = self.cells[org.start + org.ip]

            if opcode not in INSTRUCTION_SET:
                # 无效指令，当作 NOP
                org.ip += 1
                steps += 1
                continue

            name, needs_operand, cost = INSTRUCTION_SET[opcode]
            steps += cost

            # 读取操作数（如果需要）
            operand = 0
            if needs_operand:
                operand_pos = org.start + org.ip + 1
                if operand_pos < org.start + org.length:
                    operand = self.cells[operand_pos]
                org.ip += 2
            else:
                org.ip += 1

            # ── 执行指令 ──────────────────────────────────
            if opcode == NOP:
                pass  # 空操作，什么都不做

            elif opcode == REPL:
                # 自复制 —— 这是整个模拟的核心操作
                # 触发复制自身，可能产生突变子代
                child = self.replicate(org)

            elif opcode == HLT:
                break  # 停机

            elif opcode == INC:
                org.acc += 1

            elif opcode == DEC:
                org.acc -= 1

            elif opcode == SET:
                org.acc = operand

            elif opcode == ADD:
                org.acc += operand

            elif opcode == SUB:
                org.acc -= operand

            elif opcode == JMP:
                # 相对跳转
                org.ip += operand

            elif opcode == JZ:
                if org.acc == 0:
                    org.ip += operand

            elif opcode == JNZ:
                if org.acc != 0:
                    org.ip += operand

            elif opcode == READ:
                # 从当前有机体内部读取数据
                read_pos = org.start + org.ip + operand
                if org.start <= read_pos < org.start + org.length:
                    org.acc = self.cells[read_pos]

            elif opcode == WRITE:
                # 向当前有机体内部写入数据
                write_pos = org.start + org.ip + operand
                if org.start <= write_pos < org.start + org.length:
                    self.cells[write_pos] = org.acc

            # IP 边界检查
            if org.ip < INSTRUCTION_OFFSET:
                org.ip = INSTRUCTION_OFFSET
            if org.ip >= org.length:
                break

        org.steps_this_cycle = steps
        return child

    # ── 自然选择 ──────────────────────────────────────────

    def _natural_selection(self) -> None:
        """
        自然选择规则:
        - 当沙盒占用率超过 85% 时，触发淘汰
        - 淘汰标准: 适应度最低的个体优先淘汰
        - 长期不活动的个体优先淘汰
        - 每次淘汰到占用率降至 75% 以下

        不人工干预演化方向，完全由环境筛选。
        """
        occupancy = self.used_cells / self.size

        if occupancy < 0.85:
            return  # 空间充足，无需淘汰

        target_occupancy = 0.75
        target_used = int(self.size * target_occupancy)
        to_free = self.used_cells - target_used

        if to_free <= 0:
            return

        # 按适应度排序（最低的在前）
        # 适应度 = 活跃度 / 长度
        ranked = sorted(self.organisms, key=lambda org: org.compute_fitness())

        freed = 0
        eliminated = 0
        for org in ranked:
            if freed >= to_free:
                break
            freed += org.length
            eliminated += 1
            self.deallocate_organism(org)

        if eliminated > 0:
            self._log(f"🗑 自然选择: 淘汰 {eliminated} 个劣势个体，释放 {freed} 格")

    # ── 环境扰动 ──────────────────────────────────────────

    def _environmental_disturbance(self) -> None:
        """
        环境扰动: 随机清零少量格子，模拟自然环境变化。
        - 可能破坏有机体（如果清除了有机体的关键数据）
        - 被破坏的有机体可能死亡或发生"突变"
        - 增加环境的不确定性，防止种群陷入局部最优
        """
        affected = 0
        dead_orgs = []

        for _ in range(DISTURBANCE_STRENGTH):
            pos = random.randint(0, self.size - 1)
            if self.cells[pos] != 0:
                self.cells[pos] = 0
                affected += 1

        # 检查是否有有机体被破坏
        for org in self.organisms[:]:
            if not self.validate_organism(org):
                dead_orgs.append(org)

        for org in dead_orgs:
            self._log(f"💀 有机体 #{org.start} 被环境扰动摧毁 (代{org.generation})")
            self.deallocate_organism(org)

        if affected > 0:
            self._log(f"🌪 环境扰动: 清零 {affected} 格，摧毁 {len(dead_orgs)} 个有机体")

    # ── 统计 ──────────────────────────────────────────────

    def get_stats(self) -> Dict[str, Any]:
        """获取当前种群统计"""
        if not self.organisms:
            return {
                'cycle': self.cycle,
                'population': 0,
                'species': 0,
                'avg_length': 0,
                'max_generation': 0,
                'total_born': self.total_born,
                'total_died': self.total_died,
                'total_replications': self.total_replications,
                'used_cells': self.used_cells,
                'occupancy': 0.0,
                'dominant_species': '-',
                'top_organisms': [],
            }

        # 物种分类（按指令签名）
        species_map: Dict[str, List[Organism]] = defaultdict(list)
        for org in self.organisms:
            sig = org.instruction_signature(self.cells)
            species_map[sig].append(org)

        # 按适应度排序
        ranked = sorted(self.organisms, key=lambda o: o.compute_fitness(), reverse=True)
        top_orgs = ranked[:8]

        # 优势物种
        dominant_sig = max(species_map, key=lambda s: len(species_map[s]))
        dominant_count = len(species_map[dominant_sig])
        dominant_instr = species_map[dominant_sig][0].instruction_display(self.cells)

        avg_len = sum(o.length for o in self.organisms) / len(self.organisms)

        return {
            'cycle': self.cycle,
            'population': len(self.organisms),
            'species': len(species_map),
            'avg_length': round(avg_len, 1),
            'max_generation': max(o.generation for o in self.organisms),
            'total_born': self.total_born,
            'total_died': self.total_died,
            'total_replications': self.total_replications,
            'used_cells': self.used_cells,
            'occupancy': self.used_cells / self.size,
            'dominant_species': dominant_instr,
            'dominant_count': dominant_count,
            'top_organisms': top_orgs,
        }

    def get_top_organism_instructions(self) -> Optional[Tuple[Organism, str]]:
        """获取当前最优个体的指令序列"""
        if not self.organisms:
            return None
        top = max(self.organisms, key=lambda o: o.compute_fitness())
        instrs = top.instruction_display(self.cells)
        return top, instrs

    def save_snapshot(self, filepath: str) -> None:
        """保存种群快照到 JSON 文件"""
        stats = self.get_stats()
        snapshot = {
            'timestamp': datetime.now().isoformat(),
            'stats': stats,
            'config': {
                'sandbox_size': self.size,
                'max_time_slices': self.max_slices,
                'mutation_rate': MUTATION_RATE,
                'disturbance_interval': DISTURBANCE_INTERVAL,
                'disturbance_strength': DISTURBANCE_STRENGTH,
            },
            'top_organisms': [],
        }

        for org in stats['top_organisms']:
            snapshot['top_organisms'].append({
                'start': org.start,
                'length': org.length,
                'generation': org.generation,
                'age': org.age,
                'replicate_count': org.replicate_count,
                'fitness': round(org.compute_fitness(), 4),
                'instructions': org.instruction_display(self.cells),
                'signature': org.instruction_signature(self.cells),
            })

        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(snapshot, f, ensure_ascii=False, indent=2)
        self._log(f"💾 快照已保存: {filepath}")

    def _log(self, msg: str) -> None:
        """添加日志消息"""
        self.log_messages.append(f"[{self.cycle}] {msg}")
        if len(self.log_messages) > 20:
            self.log_messages.pop(0)


# ============================================================
#  观测面板（Observer） —— 控制台实时显示
# ============================================================

class Observer:
    """
    控制台观测面板。
    使用 ANSI 转义序列实现动态刷新，提供直观的种群演化视图。
    """

    # ANSI 颜色代码
    RED    = '\033[91m'
    GREEN  = '\033[92m'
    YELLOW = '\033[93m'
    BLUE   = '\033[94m'
    CYAN   = '\033[96m'
    WHITE  = '\033[97m'
    BOLD   = '\033[1m'
    DIM    = '\033[2m'
    RESET  = '\033[0m'
    CLEAR  = '\033[2J\033[H'

    # 顶部边框装饰
    TOP_BORDER    = '╔' + '═' * 68 + '╗'
    MID_BORDER    = '╠' + '═' * 68 + '╣'
    BOTTOM_BORDER = '╚' + '═' * 68 + '╝'
    THIN_LINE     = '╟' + '─' * 68 + '╢'

    def __init__(self):
        self.last_stats = None
        self.last_display = ''

    def render(self, sandbox: Sandbox, paused: bool = False) -> None:
        """渲染观测面板"""
        stats = sandbox.get_stats()
        lines = []

        # 清屏
        lines.append(self.CLEAR)

        # 标题栏
        lines.append(self.TOP_BORDER)
        title = '  自下而上 · 数字演化沙盒  —  Artificial Life Evolution Sandbox'
        title_padding = ' ' * (68 - len(title))
        lines.append(f'║{self.BOLD}{self.CYAN}{title}{self.RESET}{title_padding}║')
        lines.append(self.MID_BORDER)

        # 状态指示
        status = f'{self.RED}● 暂停{self.RESET}' if paused else f'{self.GREEN}● 运行中{self.RESET}'
        lines.append(f'║  {status}'
                     f'    周期: {self.YELLOW}{stats["cycle"]:>6}{self.RESET}'
                     f'  │  种群: {self.GREEN}{stats["population"]:>5}{self.RESET}'
                     f'  │  物种: {self.BLUE}{stats["species"]:>4}{self.RESET}'
                     f'  │  均长: {stats["avg_length"]:>5}'
                     f'  │  最高代: {stats["max_generation"]:>4}'
                     f'     ║')

        # 资源状态
        occ_pct = stats['occupancy'] * 100
        occ_bar = self._bar(occ_pct / 100, 20)
        lines.append(f'║  空间占用: {occ_bar} {occ_pct:.1f}%'
                     f'  │  累计诞生: {stats["total_born"]:>5}'
                     f'  │  累计死亡: {stats["total_died"]:>5}'
                     f'  │  总复制: {stats["total_replications"]:>6}'
                     f'     ║')

        lines.append(self.THIN_LINE)

        # 优势物种信息
        dom = stats['dominant_species']
        if len(dom) > 55:
            dom = dom[:52] + '...'
        dom_padding = ' ' * max(0, 55 - len(dom))
        lines.append(f'║  {self.BOLD}优势物种 ({stats["dominant_count"]} 个):{self.RESET} '
                     f'{self.GREEN}{dom}{self.RESET}{dom_padding}║')

        lines.append(self.THIN_LINE)

        # 个体排行榜
        header = (f'║  {"ID":>6} │ {"长度":>4} │ {"代":>3} │ {"年龄":>4} │ '
                  f'{"复制":>4} │ {"适应度":>6} │ 指令序列')
        lines.append(header + ' ' * (68 - len(header) + 1) + '║')

        for rank, org in enumerate(stats['top_organisms'], 1):
            instrs = org.instruction_display(sandbox.cells)
            if len(instrs) > 35:
                instrs = instrs[:32] + '...'
            fitness = org.compute_fitness()

            # 根据适应度着色
            if fitness > 0.5:
                fit_str = f'{self.GREEN}{fitness:>6.4f}{self.RESET}'
            elif fitness > 0.2:
                fit_str = f'{self.YELLOW}{fitness:>6.4f}{self.RESET}'
            else:
                fit_str = f'{self.DIM}{fitness:>6.4f}{self.RESET}'

            line = (f'║  {org.start:>6} │ {org.length:>4} │ {org.generation:>3} │ '
                    f'{org.age:>4} │ {org.replicate_count:>4} │ {fit_str} │ '
                    f'{instrs}')
            # 计算显示宽度（去掉 ANSI 码）
            visible_len = self._visible_len(line)
            padding = max(0, 80 - visible_len)
            lines.append(line + ' ' * padding + '║')

        # 填充空行
        for _ in range(len(stats['top_organisms']), 8):
            lines.append(f'║{" " * 78}║')

        lines.append(self.THIN_LINE)

        # 日志
        recent_logs = sandbox.log_messages[-3:]
        for log in recent_logs:
            log_line = f'║  {self.DIM}{log}{self.RESET}'
            visible_len = self._visible_len(log_line)
            lines.append(log_line + ' ' * max(0, 80 - visible_len) + '║')

        if not recent_logs:
            lines.append(f'║{" " * 78}║')

        lines.append(self.BOTTOM_BORDER)

        # 控制栏
        lines.append(f'  {self.BOLD}[p]{self.RESET}暂停/继续  '
                     f'{self.BOLD}[s]{self.RESET}快照  '
                     f'{self.BOLD}[i]{self.RESET}查看优势个体  '
                     f'{self.BOLD}[d]{self.RESET}手动扰动  '
                     f'{self.BOLD}[q]{self.RESET}退出  '
                     f'│  突变率: {MUTATION_RATE:.1%}  '
                     f'│  扰动间隔: {DISTURBANCE_INTERVAL}')

        # 输出
        display = '\n'.join(lines)
        sys.stdout.write(display)
        sys.stdout.flush()

        self.last_stats = stats
        self.last_display = display

    @staticmethod
    def _bar(fraction: float, width: int) -> str:
        """绘制进度条"""
        filled = int(fraction * width)
        if fraction > 0.85:
            color = Observer.RED
        elif fraction > 0.5:
            color = Observer.YELLOW
        else:
            color = Observer.GREEN
        return f'{color}{"█" * filled}{Observer.DIM}{"░" * (width - filled)}{Observer.RESET}'

    @staticmethod
    def _visible_len(s: str) -> int:
        """计算去掉 ANSI 转义码后的可见长度"""
        return len(re.sub(r'\033\[[0-9;]*m', '', s))

    def show_organism_detail(self, sandbox: Sandbox) -> None:
        """显示当前最优个体的详细信息"""
        result = sandbox.get_top_organism_instructions()
        if result is None:
            print(f"\n{self.RED}种群为空，无个体可查看。{self.RESET}")
            return

        org, instrs = result
        print(f"\n{self.CLEAR}")
        print(f"{self.BOLD}{self.CYAN}═══ 优势个体详情 ═══{self.RESET}\n")
        print(f"  起始位置:     {org.start}")
        print(f"  总长度:       {org.length} 格 (头部 {HEADER_SIZE} + 指令 {org.length - HEADER_SIZE})")
        print(f"  代数:         {org.generation}")
        print(f"  年龄:         {org.age} 轮")
        print(f"  累计复制:     {org.replicate_count} 次")
        print(f"  适应度:       {org.compute_fitness():.6f}")
        print(f"  指令签名:     {org.instruction_signature(sandbox.cells)}")
        print(f"\n  {self.BOLD}指令序列:{self.RESET}")
        print(f"  {self.GREEN}{instrs}{self.RESET}")

        # 逐条解释
        instructions = org.get_instructions(sandbox.cells)
        print(f"\n  {self.BOLD}逐条解析:{self.RESET}")
        i = 0
        step = 0
        while i < len(instructions):
            op = instructions[i]
            name, needs_op, _ = INSTRUCTION_SET.get(op, ("???", False, 1))
            if needs_op and i + 1 < len(instructions):
                op_val = instructions[i + 1]
                print(f"    [{step:>2}] {name:>5} {op_val:>4}")
                i += 2
            else:
                print(f"    [{step:>2}] {name:>5}")
                i += 1
            step += 1

        print(f"\n{self.DIM}按 Enter 返回...{self.RESET}")
        input()


# ============================================================
#  输入处理 —— 非阻塞键盘输入
# ============================================================

def get_key_nonblocking() -> Optional[str]:
    """
    非阻塞读取键盘输入。
    使用 select 检查 stdin 是否有数据可读。
    """
    if sys.stdin in select.select([sys.stdin], [], [], 0)[0]:
        return sys.stdin.read(1)
    return None


# ============================================================
#  主模拟循环
# ============================================================

def run_simulation():
    """运行数字演化模拟的主循环"""

    # 初始化沙盒
    sandbox = Sandbox(SANDBOX_SIZE, MAX_TIME_SLICES)
    observer = Observer()

    # 设置随机种子
    if RANDOM_SEED is not None:
        random.seed(RANDOM_SEED)

    # 打印启动信息
    print(observer.CLEAR)
    print(f"{observer.BOLD}{observer.CYAN}")
    print("╔══════════════════════════════════════════════════════════╗")
    print("║     自下而上 · 数字演化沙盒  —  Artificial Life Sandbox  ║")
    print("╚══════════════════════════════════════════════════════════╝")
    print(f"{observer.RESET}")
    print(f"  沙盒大小: {SANDBOX_SIZE} 格  │  算力: {MAX_TIME_SLICES} 片/轮")
    print(f"  突变率:   {MUTATION_RATE:.1%}        │  扰动间隔: {DISTURBANCE_INTERVAL} 轮")
    print(f"  初始种子: {INITIAL_SEEDS} 个         │  随机种子: {RANDOM_SEED}")
    print(f"\n{observer.DIM}  投放初始生命种子...{observer.RESET}")
    time.sleep(0.5)

    # 投放种子
    sandbox.seed_initial_life(INITIAL_SEEDS)

    if len(sandbox.organisms) == 0:
        print(f"\n{observer.RED}错误: 无法投放种子，沙盒空间不足！{observer.RESET}")
        return

    # 初始化终端（关闭行缓冲）
    fd = sys.stdin.fileno()
    old_settings = termios.tcgetattr(fd)

    paused = False
    running = True
    cycle_delay = 0.05  # 每轮之间的延迟（秒），控制显示刷新速度

    try:
        tty.setcbreak(fd)  # 设置 cbreak 模式，字符即刻可用

        while running:
            # 处理键盘输入
            key = get_key_nonblocking()
            if key:
                if key == 'q':
                    running = False
                    break
                elif key == 'p':
                    paused = not paused
                    sandbox._log(f"{'⏸ 暂停' if paused else '▶ 继续'}")
                elif key == 's':
                    ts = datetime.now().strftime('%Y%m%d_%H%M%S')
                    snap_dir = SNAPSHOT_DIR or os.path.dirname(os.path.abspath(__file__))
                    snap_path = os.path.join(snap_dir, f'snapshot_{ts}.json')
                    sandbox.save_snapshot(snap_path)
                elif key == 'i':
                    # 暂停并显示详情
                    was_paused = paused
                    paused = True
                    observer.render(sandbox, paused=True)
                    observer.show_organism_detail(sandbox)
                    paused = was_paused
                elif key == 'd':
                    sandbox._environmental_disturbance()
                    sandbox._log("⚡ 手动触发环境扰动")

            # 执行模拟（非暂停时）
            if not paused:
                sandbox.execute_cycle()

            # 渲染观测面板
            observer.render(sandbox, paused)

            # 控制刷新速率
            if not paused:
                time.sleep(cycle_delay)
            else:
                time.sleep(0.1)

    except KeyboardInterrupt:
        pass
    finally:
        # 恢复终端设置
        termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
        print(observer.CLEAR)
        print(f"{observer.GREEN}模拟结束。{observer.RESET}")
        print(f"  最终统计:")
        stats = sandbox.get_stats()
        print(f"    总轮次:     {stats['cycle']}")
        print(f"    最终种群:   {stats['population']}")
        print(f"    物种数:     {stats['species']}")
        print(f"    平均长度:   {stats['avg_length']}")
        print(f"    累计诞生:   {stats['total_born']}")
        print(f"    累计死亡:   {stats['total_died']}")
        print(f"    总复制次数: {stats['total_replications']}")
        print(f"    优势物种:   {stats['dominant_species']}")

        # 自动保存最终快照
        ts = datetime.now().strftime('%Y%m%d_%H%M%S')
        snap_dir = SNAPSHOT_DIR or os.path.dirname(os.path.abspath(__file__))
        snap_path = os.path.join(snap_dir, f'final_snapshot_{ts}.json')
        sandbox.save_snapshot(snap_path)


# ============================================================
#  入口
# ============================================================

if __name__ == '__main__':
    run_simulation()