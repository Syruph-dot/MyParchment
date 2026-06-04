# 01-D 状态转移与 tearOutPage

## 本阶段目标

本阶段的重点不是继续扩展更多功能，而是理解并实现第一个真正的领域状态转移动作：

- `tearOutPage(pageId)`

它表示：

- 一张仍在草稿本中的页
- 被撕下
- 变成独立散页

这一步让项目从“数据结构练习”进入了真正的“领域行为建模”。

---

## 本阶段最重要的认识

### 1. `tearOutPage` 不是普通更新

`updatePage(...)` 做的是：

- 同一个页
- 同一种状态
- 修改页内容

而 `tearOutPage(...)` 做的是：

- 同一个页
- 从一种状态变成另一种状态

也就是说，它不是普通内容编辑，而是：

> 状态转移

---

### 2. 这不是简单的“删除旧页，再新增新页”

从实现细节上看，`tearOutPage(...)` 确实会：

- 从 `Notebook.pages` 中移除原页
- 在统一页索引中放入一个 `LooseLeafPage`

但从业务语义上看，它不是两个无关对象的替换，而是：

- 同一张纸
- 保留同一个 `id`
- 保留同一份 `blocks`
- 保留同一个 `maxCharacterCount`
- 只改变它的存在状态

因此更准确的理解是：

> 同一业务对象从 `NotebookPage` 迁移成 `LooseLeafPage`

---

## 当前最小状态机

到本阶段为止，`Page` 的状态可以先理解成两种：

- `notebook-page`
- `loose-leaf-page`

对应的最小规则表：

| 当前状态 | 动作 | 下一状态 | 合法性 |
|---|---|---|---|
| `notebook-page` | `updatePage` | `notebook-page` | 合法 |
| `loose-leaf-page` | `updatePage` | `loose-leaf-page` | 合法 |
| `notebook-page` | `tearOutPage` | `loose-leaf-page` | 合法 |
| `loose-leaf-page` | `tearOutPage` | - | 非法 |

这张表的意义非常大，因为它说明：

- 不是所有动作都适用于所有状态
- 方法里的 `if` 判断不是随便写的
- 它们本质上是在执行状态机规则

---

## 本阶段学习到的 TypeScript 概念

### 1. 判别联合类型的真正用途

前面已经把 `Page` 建模为：

```ts
NotebookPage | LooseLeafPage
```

而本阶段第一次真正把这个模型用到行为里。

例如：

```ts
if (!page || page.kind !== "notebook-page") {
  throw new Error(...);
}
```

这段判断有两个作用：

- 业务上：限制只有 notebook page 才能被撕下
- 类型上：让 TypeScript 知道后面的 `page` 一定是 `NotebookPage`

这叫：

- 类型收窄

---

### 2. `throw new Error(...)` 的使用边界

本阶段明确了一类场景适合 `throw`：

- 当前动作必须成功，否则就属于非法状态

具体到 `tearOutPage(...)`：

- 页不存在：非法
- 页不是 `NotebookPage`：非法
- 页指向的 notebook 不存在：非法

所以这里不适合静默跳过，也不适合只 `console.warn`。

---

## 本阶段学习到的软件工程模式

### 1. `requireXxx(...)` 模式

本阶段引入了：

- `requireNotebookPage(pageId)`
- `requireNotebookByPage(page)`

它们的共同特点是：

- 成功时返回一个“已经满足条件”的对象
- 失败时直接 `throw`

这和返回 `undefined` 的 helper 很不一样。

它的价值在于：

- 调用方不必反复判空
- 主流程更短
- 校验和报错逻辑集中

例如：

```ts
const page = this.requireNotebookPage(pageId);
const notebook = this.requireNotebookByPage(page);
```

这种写法明显比一长串嵌套 `if` 更清楚。

---

### 2. 实体内容更新 vs 容器成员关系更新

本阶段开始明确区分两种变化：

**实体内容更新**

例如：

```ts
thePage.blocks = trimmedBlocks;
```

这是在改页内容。

**容器成员关系更新**

例如：

```ts
notebook.pages = notebook.pages.filter((p) => p.id !== pageId);
```

这是在改 notebook 内部有哪些页。

这两种变化经常同时出现，但它们不是一回事。

把它们分清，是后面做复杂业务动作的基础。

---

### 3. 统一索引覆盖，比删除再新增更贴近语义

在 `tearOutPage(...)` 里，当前更合理的做法是：

- 直接用同一个 `pageId` 注册新的 `LooseLeafPage`

而不是：

- 从索引里删除
- 再用一个全新语义去补

因为当前模型更强调：

- 这是同一页的状态变化

而不是：

- 一个对象被销毁，另一个全新对象凭空出现

---

## 当前 `tearOutPage(...)` 的业务步骤

当前第一版逻辑可以理解为：

1. 要求取到一个 `NotebookPage`
2. 要求取到它所属的 `Notebook`
3. 从 `Notebook.pages` 中移除它
4. 构造一个同 id 的 `LooseLeafPage`
5. 用统一索引注册这个新状态

这说明一个业务动作在实现层常常会拆成多步：

- 一个动作
- 多个容器同步更新

---

## 本阶段对 API 设计的进一步认识

### `updatePage` 和 `tearOutPage` 不能混

本阶段进一步看清：

- `updatePage(...)` 是内容更新
- `tearOutPage(...)` 是状态转移

虽然它们都操作 `Page`，但它们不是一类动作。

因此在设计 API 时，应该把它们明确分开，而不是试图合并成一个“万能方法”。

---

## 当前代码层面的阶段结果

到本阶段为止，`InMemoryParchmentService` 已经具备：

- `createNotebook(...)`
- `getPage(...)`
- `createLooseLeafPage(...)`
- `updatePage(...)`
- `tearOutPage(...)`

其中最重要的新能力是：

- `tearOutPage(...)` 可以把 `NotebookPage` 转成 `LooseLeafPage`

这意味着当前模块已经具备了最小的“页状态流转”能力。

---

## 当前阶段的不足

虽然本阶段已经完成了 `tearOutPage(...)` 的第一版，但还有一些明显未完成点：

- `createNotebook(...)` 尚未做重复 id 检查
- `createLooseLeafPage(...)` 尚未做重复 page id 检查
- `ClipGroup` 还未开始建模
- 尚未引入测试
- 暂时仍是内存实现，没有持久化

这些都属于下一阶段可以继续推进的内容。

---

## 下一步计划

下一步最自然的方向有两个：

### 方向 A：补强当前 service 的防御性

- notebookId 重复检查
- pageId 重复检查
- 更明确的错误边界

### 方向 B：进入 `ClipGroup`

- 定义回形针组
- 让多个 loose leaf page 形成一组
- 保持统一检索和可编辑

从学习节奏看，建议先做方向 A，再进入方向 B。这样后面的组装逻辑会更稳。
