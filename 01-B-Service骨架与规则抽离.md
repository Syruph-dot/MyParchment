# 01-B Service骨架与规则抽离

## 本阶段目标

本阶段的目标不是完成完整业务，而是继续围绕 MyParchment 学习 TypeScript，并把模块骨架搭出来。

重点是：

- 从 `interface` 走到 `class implements`
- 在类中保存内部状态
- 让一个最小的内存版 service 开始工作
- 学会把复杂规则从主流程中抽成私有方法

---

## 当前已完成的结构

### 1. 应用层接口

文件：

- `src/application/parchment-service.ts`

当前接口职责：

- 对外暴露模块能力
- 不暴露内部存储细节

当前最小方法集合：

- `createNotebook()`
- `getPage(pageId)`
- `updatePage(pageId, blocks)`

---

### 2. 内存实现类

文件：

- `src/application/in-memory-parchment-service.ts`

当前类名：

- `InMemoryParchmentService`

命名含义：

- `ParchmentService` 表示角色
- `InMemory` 表示实现方式

也就是说，它表示：

> 一个以内存作为存储方式的 ParchmentService 实现

---

## 本阶段学习到的 TypeScript 概念

### 1. `class implements interface`

例子方向：

```ts
export class InMemoryParchmentService implements ParchmentService {
  // ...
}
```

含义：

- `ParchmentService` 先定义能力边界
- `InMemoryParchmentService` 作为具体实现者
- `implements` 表示该类必须满足接口要求

工程意义：

- 接口和实现分开
- 不同实现可以替换
- 更利于测试和重构

---

### 2. `private`

本阶段已经用于：

- 私有字段 `pages`
- 私有方法 `trimBlocksToFit`

例子：

```ts
private pages: Map<string, Page> = new Map();
```

```ts
private trimBlocksToFit(
  blocks: TextBlock[],
  maxCharacterCount: number
): TextBlock[] {
  // ...
}
```

含义：

- 这些内容只允许类内部使用
- 外部调用方不能直接访问

工程意义：

- 隐藏内部实现细节
- 防止外部直接篡改状态
- 保持模块边界清楚

---

### 3. `Map<K, V>`

当前代码中使用：

```ts
private pages: Map<string, Page> = new Map();
```

含义：

- key 是 `string`
- value 是 `Page`

用途：

- 通过 `pageId` 快速查找页面

相比随便用对象字面量，当前阶段 `Map` 更适合教学，因为它能明确表达：

- 存储关系
- `get`
- `set`

---

### 4. `this`

本阶段第一次真正使用：

```ts
this.pages.get(pageId)
this.pages.set(pageId, page)
this.trimBlocksToFit(blocks, maxCharacterCount)
```

含义：

- `this` 指向当前这个类实例
- 通过 `this` 访问实例内部的字段和方法

当前理解：

- `this.pages` 是当前 service 自己维护的内部页面仓库
- `this.trimBlocksToFit(...)` 是调用自己内部的私有规则方法

---

### 5. 可选链 `?.`

本阶段第一次使用：

```ts
this.pages.get(pageId)?.maxCharacterCount
```

含义：

- 如果 `get(pageId)` 有结果，就继续取 `maxCharacterCount`
- 如果没有结果，就返回 `undefined`

它避免了“先判断有没有 page 再取字段”的冗长写法。

---

### 6. 字符串截断 `slice`

本阶段用于：

- 超出页面字数限制时，截断最后一个块的文本

正确用法：

```ts
block.text.slice(0, remainingCharacters)
```

含义：

- 保留前 `remainingCharacters` 个字符

这里曾经出现过一个典型错误：

```ts
slice(0, -remainingCharacters)
```

这个写法语义不对，会得到错误长度的结果。

---

## 当前已经实现的业务规则

### 页面更新时有最大字数限制

当前规则：

- `updatePage(pageId, blocks)` 更新页面内容
- 如果总字数未超限，正常保存
- 如果超限：
  - 保留前面的完整块
  - 对第一个超限块做部分截断
  - 后续块全部丢弃
  - 输出 `console.warn(...)`

这说明业务规则不一定只有“报错”这一种形式，也可以是：

- 自动整理输入
- 再保存合法结果

这是一种“规范化输入”的思路。

---

## 本阶段最重要的软件工程认识

### 1. 部分数据不等于完整对象

典型例子：

- `TextBlock[]` 不是 `Page`
- `Page` 里面包含 `TextBlock[]`

所以不能把：

```ts
this.pages.set(pageId, blocks)
```

当作合法写法。

必须先构造：

```ts
const page: Page = {
  id: pageId,
  blocks,
  maxCharacterCount,
};
```

再存入 `Map<string, Page>`。

---

### 2. 高层流程和底层规则要拆开

如果所有逻辑都堆在 `updatePage` 里，代码会越来越难读。

因此本阶段把截断逻辑抽成了：

- `private trimBlocksToFit(...)`

这带来的好处：

- `updatePage` 更短，更像流程说明
- 截断规则更独立
- 后续更容易测试和修改

这就是“单一职责”的初步体现。

---

### 3. 命名应该表达语义，而不只是缩写

本阶段逐渐从：

- `mCC`

过渡到：

- `maxCharacterCount`
- `currentCharacterCount`
- `remainingCharacters`

这是值得坚持的习惯。

短缩写在小玩具代码里看似省事，但在真实项目里会明显降低可读性。

---

## 当前代码状态

当前已经具备一个最小可运行的 service 雏形：

- 可以创建 service 实例
- 可以按 `pageId` 获取页面
- 可以更新页面
- 更新时会自动应用字数限制规则

但当前仍有明显建模缺口：

- `createNotebook()` 仍然只是返回固定字符串
- 还没有真正定义 `Notebook`
- 目前 service 更像一个 page store，而不是完整草稿本模块

---

## 下一步计划

下一步将开始补上真正的 `Notebook` 概念。

后续学习重点：

- 定义 `Notebook` 类型
- 引入 `notebooks` 存储
- 让 `createNotebook()` 真正创建一本 60 页草稿本
- 让 `Page` 和 `Notebook` 建立真实关系

这会让当前模块从“页面容器”升级成真正贴近需求的“草稿本核心模块”。
