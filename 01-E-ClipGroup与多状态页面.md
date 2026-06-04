# 01-E ClipGroup与多状态页面

## 本阶段目标

本阶段的目标是把“多张散页用回形针别成一组”落成最小可用模型，并继续沿用当前项目已经建立起来的几个原则：

- 领域动作要明确
- `Page` 可以有多种状态
- 所有页面仍然要能统一检索
- service 层负责协调多个存储容器

本阶段完成后，项目中的 `Page` 已经从两种状态扩展到了三种状态。

---

## 本阶段新增的领域概念

### 1. `ClipGroup`

新增文件：

- `src/domain/clipgroup.ts`

当前建模方式：

```ts
export type ClipGroup = {
  readonly id: string;
  pages: ClipGroupPage[];
};
```

这表示：

- 一个回形针组有自己的 id
- 当前直接持有组内页面对象

这是一种可行设计，但也意味着：

- `ClipGroup` 和统一页索引之间形成双引用
- 后续如果做解组、移动组成员、持久化，会继续影响实现复杂度

当前阶段先接受这个复杂度，以换取更直观的理解。

---

### 2. `ClipGroupPage`

本阶段在 `src/domain/page.ts` 中为 `Page` 增加了第三种状态：

```ts
export type ClipGroupPage = BasePage & {
  readonly kind: "clip-group-page";
  readonly clipGroupId: string;
};
```

因此当前 `Page` 联合类型已经变成：

```ts
NotebookPage | LooseLeafPage | ClipGroupPage
```

这说明项目中的页面现在可以处于三种状态：

- `notebook-page`
- `loose-leaf-page`
- `clip-group-page`

---

## 本阶段最重要的建模选择

### 你选择的是“状态转移”路线

这次建模有两种典型路线：

1. `LooseLeafPage` 保持不变，只在上面附加组关系
2. 进入组后，页面状态变成 `ClipGroupPage`

当前实现选择了第 2 条路线。

也就是说：

- 被夹入组不是单纯“多了一个关系”
- 而是页面自身状态发生了变化

因此：

```ts
LooseLeafPage -> ClipGroupPage
```

是一次新的状态转移。

这条路线的优点：

- 状态清晰
- `kind` 更能表达当前页面身份
- 更适合继续练习状态机思维

代价：

- 后续解组会更复杂
- “是否在组中”变成状态，而不是附加属性
- 对 service 的迁移逻辑要求更高

---

## 本阶段新增的 service 能力

### 1. `createClipGroup(...)`

当前接口中新增：

```ts
createClipGroup(clipGroupId: string): void;
```

当前行为：

- 创建一个空的 `ClipGroup`
- 放入 `clipGroups` 存储
- 对 `clipGroupId` 做唯一性检查

这里体现了一点新的 API 取舍：

- 你决定“创建组时无需限制成员数量”
- 所以建组本身和入组动作被拆开

也就是说，当前模型支持：

1. 先创建空组
2. 再逐张把 loose leaf 夹进去

---

### 2. `clipLooseleaf(...)`

新增接口：

```ts
clipLooseleaf(pageId: string, clipGroupId: string): void;
```

它当前承担的职责是：

1. 要求取到一个 `LooseLeafPage`
2. 要求取到一个已有 `ClipGroup`
3. 构造一个 `ClipGroupPage`
4. 从统一页索引中移除原 `LooseLeafPage`
5. 把 `ClipGroupPage` 注册回统一页索引
6. 把 `ClipGroupPage` 加入组内

这说明本阶段又出现了一种明确的状态转移：

```ts
LooseLeafPage -> ClipGroupPage
```

---

## 本阶段学习到的 TypeScript 概念

### 1. 联合类型继续扩展

前一阶段的 `Page` 只有两种状态。

本阶段增加第三种后，你会更明显地体会到：

- 联合类型不是一次写死的
- 它会随着领域扩展而增长

这很贴近真实软件工程。

---

### 2. `requireXxx(...)` 模式继续复用

本阶段新增：

- `requireLooseLeafPage(pageId)`
- `requireClipGroup(clipGroupId)`

这说明 `requireXxx` 已经不只是一次性的写法，而开始成为当前 service 的通用风格。

它的价值继续体现为：

- 把校验失败和 `throw` 集中起来
- 让主流程更短
- 让返回值类型更收紧

---

### 3. 多状态对象的精确导入与使用

本阶段开始需要在实现文件中同时处理：

- `Page`
- `NotebookPage`
- `LooseLeafPage`
- `ClipGroupPage`

这会让你对“统一类型入口”和“具体子类型”之间的关系更敏感。

当前项目也因此更接近真实 TypeScript 代码，而不只是简单类型练习。

---

## 本阶段学习到的软件工程认识

### 1. “建组”与“入组”是两个不同动作

这次你做了一个重要的 API 拆分：

- `createClipGroup(...)`
- `clipLooseleaf(...)`

这和前面拆分：

- `createLooseLeafPage(...)`
- `updatePage(...)`

是同一类工程思想。

也就是：

> 一个方法尽量只表达一种主动作

如果把“创建组”和“往组里塞页”混成一个方法，后面规则会更乱。

---

### 2. 统一索引仍然是当前模型的核心

当前无论页面在哪种状态：

- `NotebookPage`
- `LooseLeafPage`
- `ClipGroupPage`

都仍然通过：

```ts
private pages: Map<string, Page>
```

进行统一检索。

这说明之前建立的“统一页索引”思路仍然成立，而且在多状态页面下更显出价值。

---

### 3. 状态越多，规则越需要显式化

本阶段开始能看出一个趋势：

- 之前只有 `notebook-page` 和 `loose-leaf-page`
- 现在增加了 `clip-group-page`

这意味着：

- 哪些动作对哪些状态合法
- 哪些动作会导致什么迁移

必须越来越明确地写出来。

也就是说，项目已经逐渐逼近“显式状态机”的需求。

---

## 当前最小状态机（扩展后）

到本阶段为止，`Page` 的状态机已经可以先写成：

| 当前状态 | 动作 | 下一状态 | 合法性 |
|---|---|---|---|
| `notebook-page` | `updatePage` | `notebook-page` | 合法 |
| `loose-leaf-page` | `updatePage` | `loose-leaf-page` | 合法 |
| `clip-group-page` | `updatePage` | `clip-group-page` | 合法 |
| `notebook-page` | `tearOutPage` | `loose-leaf-page` | 合法 |
| `loose-leaf-page` | `clipLooseleaf` | `clip-group-page` | 合法 |
| `clip-group-page` | `clipLooseleaf` | - | 当前不合法 |

这张表虽然还不完整，但已经很接近一个真实的状态机了。

---

## 本阶段已经暴露出的设计问题

本阶段不是没有问题，而是已经进入“可用，但需要继续收紧”的状态。

目前最明显的问题包括：

### 1. 组成员约束仍然不够显式

当前实现中，“不能重复夹入”更多是通过状态变化间接实现，而不是一套显式的领域规则字段。

这意味着：

- 当前流程能工作
- 但未来如果要加解组、转组、批量操作，规则会变得不够透明

### 2. `ClipGroup` 当前直接存页对象

这让当前实现很直观，但后续会带来：

- 双引用关系
- 同步复杂度
- 持久化建模难度增加

当前先接受，但这是之后值得回头优化的点。

---

## 本阶段代码结果

本阶段之后，项目当前已经具备：

- 创建 notebook
- 获取 page
- 更新 page 内容
- 撕页成 loose leaf
- 创建 clip group
- 把 loose leaf 夹入 clip group

也就是说，用户需求中的核心路径已经开始形成：

1. 有 notebook
2. 可编辑 page
3. 可撕页
4. 可把散页组成组

虽然还没有 UI，也没有持久化，但核心业务链条已经出现了。

---

## 下一步教学内容还有哪些

这个项目里依然有很多很好的教学内容，没有结束。

### 1. 显式状态机整理

你已经在用状态机思维，但还没有把它提炼成统一规则。

这是接下来最值得学的一步。

### 2. 测试

当前代码几乎没有测试。

而这个项目已经足够适合开始学：

- 单元测试
- 失败路径测试
- 状态迁移测试

这是当前最缺的一块工程能力。

### 3. 错误模型

现在主要还是 `throw new Error(...)`。

后面可以学：

- 自定义错误类型
- 更清晰的错误边界

### 4. 持久化抽象

当前只有内存实现。

后面可以学：

- repository 抽象
- JSON 文件持久化
- service 与存储分离

### 5. Console 演示层

虽然你说暂时用 Console，但目前还没有一个真正的演示脚本。

这其实很值得补，因为它会让你学会：

- 如何从模块角度使用自己写的 service
- 如何把领域动作串成一个工作流

### 6. ClipGroup 的继续演化

后面还可以学：

- 解组
- 从组中移出页面
- 转组
- 组内排序

---

## 当前阶段建议

如果目标是继续学 TypeScript 和软件工程，而不是单纯堆功能，我建议接下来的优先级是：

1. 先补测试
2. 再整理显式状态机
3. 再决定是继续扩 ClipGroup，还是开始做 Console 演示层

这是当前最能提升“工程能力”的顺序。
