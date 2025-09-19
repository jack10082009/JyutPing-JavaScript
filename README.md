# JyutPing-JavaScript｜粵拼轉換器

一個極輕量的 JavaScript 粵語拼音（粵拼 Jyutping）轉換器。給定壓縮格式的「編碼→讀音」對照表與「字→編碼」對照表，即可把單字、字串或多行文本轉為粵拼陣列。支援繁體中文與簡體中文。

- 純前端或 Node.js以及微信小程序 皆可使用(字典文件壓縮至僅166KB(**未**經過gzip,壓縮後體積更小),可放在localstorage只加載一次)
- **超大碼表，僅166KB的字典儲存了簡繁體共27290個字形的不同發音，共34721條發音對應關係**
- 無外部依賴、體積小、初始化快速
- 支援多音字（同一字對應多個讀音）
- 缺點：簡易實現，不能根據詞語匹配粵拼。但會返回所有常見音，且第一個是最常見的匹配音

## 快速開始

### 1) 取得檔案

- `JyutConverter.js`：轉換器類別（ES Module）
- `pron_map.txt`：壓縮後的「編碼 → 粵拼」映射（以逗號分隔的 `編碼:讀音` 對）
- `offline_dict.txt`：壓縮後的「字 → 編碼」映射（以連續字元表達，詳見下文）

> 註：此專案已有 `pron_map.txt`；`offline_dict.txt` 可自行生成或填入資料。

### 2) 在瀏覽器使用（ES Module）
```JavaScript
<script type="module">
  import JyutConverter from './JyutConverter.js';

  async function main() {
    const [pronMap, dict] = await Promise.all([
      fetch('./pron_map.txt').then(r => r.text()),
      fetch('./offline_dict.txt').then(r => r.text()),
    ]);

    const cvt = new JyutConverter(pronMap, dict);

    console.log(cvt.jyut('愛'));      // 單字 → [ 'oi3', 'ngoi3' ]（示例；實際讀音視資料而定）
    console.log(cvt.jyut_str('廣東話'));// 字串 → [[...],[...],...]

    const lines = cvt.jyut_line_divide('香港\n廣東話');
    console.log(lines); // 逐行、逐字的粵拼陣列
  }

  main();
</script>
```
> p.s:需要注意的是：這裡收錄了"愛"單字的正音:oi3但還有另外一個發音ngoi3,是因為經語言演變以及音樂等藝術中經常會出現一個勤音的演化，以及參考一些字庫資料，故將ngoi3也加入常用發音中，但一定是備選，正音均位於第一位。
### 3) 在 Node.js 使用
```JavaScript
import fs from 'node:fs';
import JyutConverter from './JyutConverter.js';

const pronMap = fs.readFileSync('./pron_map.txt', 'utf8');
const dict    = fs.readFileSync('./offline_dict.txt', 'utf8');

const cvt = new JyutConverter(pronMap, dict);
console.log(cvt.jyut('港'));
console.log(cvt.jyut_str('香港'));
console.log(cvt.jyut_line_divide('香港\n廣東'));
```
> 提示：若你的 Node.js 專案未啟用 ES Module，請在 `package.json` 加上 `{ "type": "module" }`，或把檔案改名為 `.mjs`。

## 資料格式（重點）

轉換器採用「壓縮字典」的兩段式資料：

1) 編碼 → 粵拼（`packed_pron_map`）
   - 內容為以逗號分隔的 `編碼:讀音` 對，如：`A:jyu4,B:ji4,...`
   - 例如某編碼 `Jn` 代表 `oi3`、`gf` 代表 `ngoi3`，則：`Jn:oi3,gf:ngoi3`

2) 字 → 編碼（`packed_dict`）
   - 內容為一串連續字元，使用「字 + 1~2 個英文字母編碼」的方式表示。
   - 若同一字有多個編碼（多音字），就把該字重覆出現。例如：`愛Jn愛gf我AX`
     - 代表：`愛 → [Jn, gf]`、`我 → [AX]`
   - 轉換器會把相同字的多個編碼合併為逗號分隔，如 `愛: "Jn,gf"`。

> 小例子（對齊上例）：
>
> - `packed_pron_map`: `Jn:oi3,gf:ngoi3,AX:ngo5`
> - `packed_dict`: `愛Jn愛gf我AX`
>
> `jyut('愛')` 會回傳 `['oi3','ngoi3']`。

## API 說明

所有方法都在 `JyutConverter` 類別上：

- `constructor(packed_pron_map = null, packed_dict = null)`
  - 可在建構時傳入兩個壓縮字串；也可稍後用 `load_pron_map` / `load_dict` 載入。

- `load_pron_map(packed_pron_map: string): void`
  - 載入「編碼 → 讀音」映射，格式為以逗號分隔的 `編碼:讀音`。

- `load_dict(packed_dict: string): void`
  - 載入「字 → 編碼」映射，格式為「字 + 1~2 個英文字母」連續出現；多音字請重覆該字。

- `jyut(char: string): string[]`
  - 傳入單一字元，回傳該字的粵拼陣列（多音字會有多個）。
  - 第一個發音是最常見的，然後如果有多個字音，則後面的字音也屬常見字音。一些棄用字音和罕見字音已被我人為刪除。
  - 若資料未載入或沒有對應，回傳 `[" "]`（單一空格字串作為佔位）。

- `jyut_str(str: string): string[][]`
  - 傳入字串，回傳「每個字的粵拼陣列」所組成的陣列。
  - 若資料未載入，回傳長度等同輸入字串的陣列，元素皆為 `[" "]`。

- `jyut_line_divide(text: string): string[][][]`
  - 以 `\n` 分行處理文本；對每一行回傳 `jyut_str` 的結果。
  - 若資料未載入，對每行回傳對應長度、元素為 `[" "]` 的陣列。

## 使用示例
```JavaScript
const cvt = new JyutConverter();

// 亦可於稍後載入
cvt.load_pron_map(map_string_here);
cvt.load_dict('dict_string_here');

console.log(cvt.jyut('愛'));       // ['oi3','ngoi3']
console.log(cvt.jyut_str('我愛')); // [['ngo5'], ['oi3','ngoi3']]

const lines = cvt.jyut_line_divide('我愛\n愛我');
// [ [ ['ngo5'], ['oi3','ngoi3'] ], [ ['oi3','ngoi3'], ['ngo5'] ] ]
```
## 注意事項

- 請先載入 `pron_map` 與 `dict`，未載入時所有查詢會以 `[" "]` 佔位。
- 多音字會回傳多個讀音，請自行決定顯示或取其中一個策略。
- `JyutConverter.js` 為 ES Module，瀏覽器請以 `type="module"` 引用，Node.js 請啟用 ESM 或使用 `.mjs`。
- 你可以把兩個字典字串放入打包器或以網絡請求載入；為效能考量，建議快取與壓縮。

# 關於/鳴謝

本庫最難的部分是在於取捨發音，即創造字典文件。

本倉庫中的詞典文件(offline_dict.txt)經過作者六天時間，整理參考了以下資料：

[CanCLID:jyutping-table-ordered](https://github.com/CanCLID/jyutping-table-ordered)

[lshk-org:jyutping-table](https://github.com/lshk-org/jyutping-table)

[人文電算研究中心:粵語審音配詞字庫](https://humanum.arts.cuhk.edu.hk/Lexis/lexi-can/)






## LICENSE

MIT LICENSE

---

如有建議或問題，歡迎提 Issue／PR，一齊令粵拼處理更易用！
