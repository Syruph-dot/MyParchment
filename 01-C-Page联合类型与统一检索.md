# 01-C Page联合类型与统一检索

## 本阶段目标

本阶段的核心不是新增功能，而是一次领域重构。

目标是把原先过于单一的 `Page`，改造成可扩展的统一页概念，使它能够：

- 以不同形态存在
- 仍然通过统一入口检索
- 为后续“撕页”“散页”“回形针分组”做准备

---

## 本阶段的关键变化

### 1. `Page` 不再是单一结构

原先的 `Page` 更像是“本子中的页面”。

但从需求看，未来至少会有两种页状态：

- 仍装订在 `Notebook` 中的页
- 被撕下后独立存在的散页

因此本阶段将 `Page` 重构为联合类型。

当前结构思路：

```ts
type BasePage = {
  readonly id: string;
  blocks: TextBlock[];
  readonly maxCharacterCount: number;
};

export type NotebookPage = BasePage & {
  readonly kind: "notebook-page";
  readonly notebookId: string;
  readonly slotIndex: number;
};

export type LooseLeafPage = BasePage & {
  readonly kind: "loose-leaf-page";
};

export type Page = NotebookPage | LooseLeafPage;
```

---

### 2. `Notebook` 页面类型收紧

当前 `Notebook` 不再持有任意 `Page[]`，而是只持有：

```ts
NotebookPage[]
```

这是因为：

- `Notebook` 中的页面必须是“仍在本子里的页”
- `LooseLeafPage` 不应该出现在 `Notebook.pages` 中

这一步是一次很典型的建模收紧。

---

### 3. service 内部保留统一页索引

当前 `InMemoryParchmentService` 内部使用：

```ts
private pages: Map<string, Page> = new Map();
```

作为统一检索入口。

同时保留：

```ts
private notebooks: Map<string, Notebook> = new Map();
```

作为草稿本集合。

这样做的当前意图是：

- `Notebook` 负责组织 notebook 内部页面
- `pages` 负责对所有页进行统一检索

这正对应了本阶段的目标：

> Page 可以分散到多种类型，但最后仍然可统一检索

---

## 本阶段学习到的 TypeScript 概念

### 1. 联合类型 `A | B`

例子：

```ts
export type Page = NotebookPage | LooseLeafPage;
```

含义：

- `Page` 不是一个固定结构
- 它可能是 `NotebookPage`
- 也可能是 `LooseLeafPage`

这让“统一名词 + 多种具体形态”成为可能。

---

### 2. 字面量类型

例子：

```ts
readonly kind: "notebook-page";
readonly kind: "loose-leaf-page";
```

这不是普通 `string`，而是固定字符串值类型。

作用：

- 用来表达对象的明确身份
- 为联合类型判别提供依据

---

### 3. 交叉类型 `&`

例子：

```ts
BasePage & {
  readonly kind: "notebook-page";
  readonly notebookId: string;
  readonly slotIndex: number;
}
```

含义：

- 先复用 `BasePage` 的共性字段
- 再添加具体类型自己的差异字段

这让建模既能复用，又能保留差异。

---

### 4. 判别联合类型

这一步虽然还没有大量写 `if (page.kind === ...)` 的分支代码，但模型已经具备了这个能力。

关键是：

- 所有 `Page` 子类型都有 `kind`
- 不同子类型的 `kind` 值固定不同

因此以后可以写：

```ts
if (page.kind === "notebook-page") {
  // TypeScript 会知道这里是 NotebookPage
}
```

这叫类型收窄。

---

## 本阶段学习到的软件工程认识

### 1. 统一概念不等于单一结构

`Page` 是一个统一概念，但不代表它只能有一种结构。

当前重构说明：

- 一个领域名词可以有多个具体状态
- 只要边界清楚，就可以统一命名、分型表示

这对后续的扩展非常重要。

---

### 2. 过早追求“唯一真相源”不一定最合适

本阶段曾经碰到一个问题：

- `Notebook.pages`
- `pages: Map<string, Page>`

似乎都在存页面。

这确实会带来一致性风险，但在当前学习阶段，保留统一页索引是有价值的，因为它服务于：

- 统一检索
- 未来跨容器召回

所以当前选择不是“最终最优结构”，而是“当前学习与演进更合适的结构”。

这是很真实的工程判断。

---

### 3. 抽私有方法不只是为了好看

本阶段继续保留并使用：

- `trimBlocksToFit(...)`
- `registerPage(...)`

它们的意义不是形式上的拆分，而是：

- 把独立规则集中管理
- 让主流程更短
- 让未来修改点更集中

尤其 `registerPage(page)` 是一次很好的抽象收紧：

- 当前只做 `this.pages.set(...)`
- 以后若要检查重复 id、记录日志、维护额外索引，只需改一个地方

---

### 4. API 的动作边界要清楚

本阶段对 `updatePage()` 的理解有了收紧。

一开始的想法是：

- 如果页不存在，就自动创建一个 `LooseLeafPage`

但后面收紧成：

- `createLooseLeafPage(...)` 是显式创建动作
- `updatePage(...)` 是更新已有页的动作
- 找不到页时，输出警告并返回

这体现了一个很重要的工程原则：

> 一个方法最好只表达一种主动作

如果一个叫“update”的方法在内部偷偷“create”，调用方会很难准确理解它的行为。

---

## 当前代码结构状态

### 1. `ParchmentService`

当前接口已经收成：

- `createNotebook(notebookId: string): void`
- `getPage(pageId: string): Page | undefined`
- `createLooseLeafPage(pageId: string, blocks: TextBlock[], maxCharacterCount: number): void`
- `updatePage(pageId: string, blocks: TextBlock[]): void`

这比更早期的接口更接近真实业务动作。

---

### 2. `createNotebook(...)`

当前已经能：

- 创建 60 个 `NotebookPage`
- 为每页填入 `kind`
- 写入 `Notebook.pages`
- 通过 `registerPage(...)` 注册到统一页索引
- 将 `Notebook` 本身存入 `notebooks`

---

### 3. `createLooseLeafPage(...)`

当前已经能：

- 创建 `LooseLeafPage`
- 先执行字数截断规则
- 注册到统一页索引

---

### 4. `updatePage(...)`

当前行为是：

- 若页存在，则按页本身的 `maxCharacterCount` 截断并更新 `blocks`
- 若页不存在，则输出警告并跳过更新

当前采用的是“直接修改已有对象内容”的可变更新方式：

```ts
thePage.blocks = trimmedBlocks;
```

这对当前学习阶段是最直观的。

---

## 当前阶段的 Git 变更摘要

当前工作区中，本阶段相关修改集中在 4 个文件：

- `src/domain/page.ts`
- `src/domain/notebook.ts`
- `src/application/parchment-service.ts`
- `src/application/in-memory-parchment-service.ts`

从 diff 统计看：

- 4 files changed
- 66 insertions
- 16 deletions

本质上，这是一轮“领域模型 + service API + 内存实现”的同步重构。

---

## 下一步计划

下一步将进入真正的状态转移动作：

- `tearOutPage(...)`

它将第一次把：

- `NotebookPage`

转成：

- `LooseLeafPage`

这会进一步锻炼：

- 联合类型建模
- 显式业务动作设计
- 统一索引更新
- notebook 内页与散页之间的状态迁移
