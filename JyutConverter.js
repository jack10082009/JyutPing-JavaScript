export default class JyutConverter{
    constructor(packed_pron_map=null,packed_dict=null){
        this.pron_map=null;//编码与读音的映射
        this.dict=null;//字与编码的映射
        this.pron_map_loaded=false;//编码是否加载完成
        this.dict_loaded=false;//字典是否加载完成
        if(packed_pron_map){this.load_pron_map(packed_pron_map);}
        if(packed_dict){this.load_dict(packed_dict);}
    }
    /**
     * 加载编码与读音的映射
     * @param {*} packed_pron_map 压缩后的编码与读音的映射字符串
     */
    load_pron_map(packed_pron_map){
        this.pron_map=Object.fromEntries(packed_pron_map.split(",").map(item => item.split(":")));
        this.pron_map_loaded=true;
    }
    /**
     * 加载字与编码的映射
     * @param {*} packed_dict 压缩后的字与编码的映射字符串
     */
    load_dict(packed_dict){
        this.dict = {}; // 初始化字典对象
        function isLetter(ch){
            const code = ch.charCodeAt(0);
            return (code >= 65 && code <= 90) || (code >= 97 && code <= 122);// A-Z 或 a-z
        }
        let i=0;
        while (i < packed_dict.length) {
            const char = packed_dict[i]; // 键（汉字或任意符号）
            i++;
            let letters = "";// 取1~2个字母
            while (i < packed_dict.length && isLetter(packed_dict[i]) && letters.length < 2) {
                letters += packed_dict[i];
                i++;
            }
            if (this.dict[char]){this.dict[char] += "," + letters;
            }else{this.dict[char] = letters;}
        }
        this.dict_loaded=true;
    }
    /**
     * 获取单字的粤拼数组
     * @param {*} char 字
     * @returns 粤拼数组
     */
    jyut(char){//bm:编码字符串
        if(!this.pron_map_loaded || !this.dict_loaded){return [" "];}
        let bm = this.dict[char];
        if (!bm) return [" "]; // 没有对应的读音
        let bms = bm.split(","); // ["Jn","gf"]
        return bms.map(code => this.pron_map[code] || " ");//["oi3","ngoi3"]
    }
    /**
     * 获取一个字符串的粤拼数组
     * @param {*} str 字符串
     * @returns 粤拼数组
     */
    jyut_str(str){
        if(!this.pron_map_loaded || !this.dict_loaded){
            return new Array(str.length).fill([" "]);//[[" "],[" "],[" "]]
        }
        let result=[];//[["oi3","ngoi3"],["oi3","ngoi3"],["oi3","ngoi3"]]
        for(let i=0;i<str.length;i++){
            result.push(this.jyut(str[i]));
        }
        return result;
    }
    /**
     * 按换行符分割文本，为每行返回粤拼数组
     * @param {*} text 文本
     * @returns 粤拼数组
     */
    jyut_line_divide(text){
        if(!this.pron_map_loaded || !this.dict_loaded){//没有加载完成，返回空的粤拼数组
            // 按换行符分割文本，为每行返回空的粤拼数组
            const lines = text.split('\n');
            const results = [];
            for (let line of lines) {
                results.push(new Array(line.length).fill([" "]));
            }
            return results;
        }
        // 按换行符分割文本
        const lines = text.split('\n');
        const results = [];
        // 对每一行调用jyut_str生成result
        for (let line of lines) {
            const lineResult = this.jyut_str(line);
            results.push(lineResult);
        }
        return results;
    }

}