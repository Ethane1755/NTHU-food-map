# Nord 色彩與樣式規範指引 (v0.23.0)

Nord 是一個由 16 種精選、柔和粉彩色調組成的色彩組合，旨在提供視覺舒適、簡約且優雅的設計風格。

---

## 🎨 色彩調色盤 (Palettes)

### 1. Polar Night (北極之夜)
主要用於背景、底層 UI 元素與深色模式的主體。

| 代碼 | 十六進制 | 建議用途 |
| :--- | :--- | :--- |
| **nord0** | `#2e3440` | **底層背景**：深色模式的背景；淺色模式的文字與括號。 |
| **nord1** | `#3b4252` | **高亮元素**：狀態列、側邊欄、彈窗、按鈕懸停。 |
| **nord2** | `#434c5e` | **選取高亮**：當前行高亮、文本選取背景。 |
| **nord3** | `#4c566a` | **輔助細節**：代碼註釋、不可見字元、縮進指南。 |

### 2. Snow Storm (雪暴)
主要用於文字、游標以及淺色模式的 UI 結構。

| 代碼 | 十六進制 | 建議用途 |
| :--- | :--- | :--- |
| **nord4** | `#d8dee9` | **主要文字/變數**：深色模式變數名；淺色模式的 UI 組件。 |
| **nord5** | `#e5e9f0` | **次要文字**：不需過度強調的 UI 文字；淺色模式選取高亮。 |
| **nord6** | `#eceff4` | **最亮色**：深色模式正文與括號；淺色模式的底層背景。 |

### 3. Frost (霜凍)
Nord 的核心色板，用於主要的強調、標籤與核心語法邏輯。

| 代碼 | 十六進制 | 建議用途 |
| :--- | :--- | :--- |
| **nord7** | `#8fbcbb` | **類別與類型**：Classes, Types, Primitives。 |
| **nord8** | `#88c0d0` | **函式與宣告 (主強調色)**：Functions, Methods, Routines。 |
| **nord9** | `#81a1c1` | **語法關鍵字**：Keywords, Operators, Tags, Punctuations。 |
| **nord10** | `#5e81ac` | **預處理語句**：Pragmas, Pre-processor statements。 |

### 4. Aurora (極光)
基於「北極光」的五種色彩，用於狀態指示、警告與數據類型。

| 代碼 | 十六進制 | 建議用途 |
| :--- | :--- | :--- |
| **nord11** | `#bf616a` | **錯誤 (Red)**：Linter 錯誤、Git 刪除內容、錯誤覆蓋。 |
| **nord12** | `#d08770` | **特殊語法 (Orange)**：Annotations, Decorators。 |
| **nord13** | `#ebcb8b` | **警告 (Yellow)**：Linter 警告、轉義字元、正則表達式。 |
| **nord14** | `#a3be8c` | **字串 (Green)**：Strings, Git 新增內容。 |
| **nord15** | `#b48ead` | **數字 (Purple)**：Numbers, Integers, Floats。 |

---

## 🛠 語法高亮邏輯 (Syntax Highlighting)

| 語法元素 | 推薦色彩代碼 | 視覺目的 |
| :--- | :--- | :--- |
| **註釋 (Comments)** | `nord3` | 降低干擾，確保專注於核心邏輯。 |
| **函式/宣告 (Calls)** | `nord8` | 高度強調，作為代碼執行的核心點。 |
| **關鍵字 (Keywords)** | `nord9` | 結構化語法導航。 |
| **類別與類型** | `nord7` | 與變數 (`nord4`) 做出明確區隔。 |
| **常規文字** | `nord6` (Dark) / `nord0` (Bright) | 基礎閱讀層。 |

---

## 📐 UI 設計模式

### 深色模式 (Dark Ambiance)
* **背景色**: `nord0`
* **側欄/狀態列**: `nord1`
* **選取區/導航**: `nord2`
* **文字內容**: `nord6`

### 淺色模式 (Bright Ambiance)
* **背景色**: `nord6`
* **側欄/面板**: `nord4`
* **選取高亮**: `nord5`
* **文字內容**: `nord0`

---
*Created by Arctic Ice Studio & Sven Greb (© 2016-2026)*