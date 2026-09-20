// ==============================
// お湯Wiki
// キャラクター詳細：Excel直接読み込み版
// ==============================


// URLからIDを取得
// 例：character.html?id=1
const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));
const urlMultiplier = Number(params.get("multiplier")) || 100;

const detail = document.getElementById("characterDetail");
// キャラクター図鑑へ戻るリンク
const backButton =
    document.querySelector(
        ".back-button"
    );

const backParams =
    new URLSearchParams();

const backPage =
    params.get("returnPage");

const backAttributes =
    params.get("returnAttributes");

const backMode =
    params.get("returnMode");

const backName =
    params.get("returnName");

if (backPage) {

    backParams.set(
        "returnPage",
        backPage
    );

    backParams.set(
        "returnAttributes",
        backAttributes || ""
    );

    backParams.set(
        "returnMode",
        backMode || "and"
    );

    backParams.set(
        "returnName",
        backName || ""
    );

    backButton.href =
        `characters.html?${backParams.toString()}`;

}


// ==============================
// 属性データ
// ==============================

const attributeIcons = {

    none: {
        name: "無属性",
        image: "images/white.png"
    },

    red: {
        name: "赤い敵",
        image: "images/red.png"
    },

    floating: {
        name: "浮いてる敵",
        image: "images/floating.png"
    },

    black: {
        name: "黒い敵",
        image: "images/black.png"
    },

    metal: {
        name: "メタル",
        image: "images/metal.png"
    },

    angel: {
        name: "天使",
        image: "images/angel.png"
    },

    alien: {
        name: "エイリアン",
        image: "images/alien.png"
    },

    zombie: {
        name: "ゾンビ",
        image: "images/zombie.png"
    },

    ancient: {
        name: "古代種",
        image: "images/ancient.png"
    },

    devil: {
        name: "悪魔",
        image: "images/devil.png"
    },

    witch: {
        name: "魔女",
        image: "images/witch.png"
    },

    apostle: {
        name: "使徒",
        image: "images/apostle.png"
    },

    starAlien: {
        name: "スターエイリアン",
        image: "images/star.png"
    },

    superLife: {
        name: "超生命体",
        image: "images/superlife.png"
    },

    beast: {
        name: "超獣",
        image: "images/beast.png"
    },

    sage: {
        name: "超賢者",
        image: "images/sage.png"
    },

    villain: {
        name: "怪人",
        image: "images/villain.png"
    },

    custom: {
        name: "お湯キャラ",
        image: "images/custom.png"
    }

};


// ==============================
// 「赤,黒」のようなExcelの
// 複数データを配列に変換
// ==============================

function splitValues(value) {

    if (
        value === undefined ||
        value === null ||
        String(value).trim() === ""
    ) {
        return [];
    }

    return String(value)
        .replace(/、/g, ",")
        .split(",")
        .map(value => value.trim())
        .filter(value => value !== "");

}


// ==============================
// Excelを読み込む
// ==============================

fetch("characters.xlsx")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "characters.xlsxを読み込めませんでした"
            );
        }

        return response.arrayBuffer();

    })

    .then(buffer => {

        // Excelファイルを読み込む
        const workbook = XLSX.read(buffer);

        // 「キャラクターデータ」シートを取得
        const worksheet =
            workbook.Sheets["キャラクターデータ"];

        if (!worksheet) {

            throw new Error(
                "「キャラクターデータ」シートが見つかりません"
            );

        }

        // Excelの表をJavaScriptの配列に変換
        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: ""
                }
            );


        // URLのIDとExcelのIDを照合
        const row =
            rows.find(
                character =>
                    Number(character.id) === id
            );


        // キャラクターが見つからなかった場合
        if (!row) {

            detail.innerHTML = `
                <div class="no-result">
                    キャラクターが見つかりません。
                </div>
            `;

            return;
        }


        // ==============================
        // Excel → キャラクターデータ
        // ==============================

        const character = {

            id: Number(row.id),

            number: String(row.number),

            name: String(row.name),

            type: String(row.type),

            image: String(row.image),

            attributes:
                splitValues(row.attributes),

            hp:
                Number(row.hp) || 0,

            attack:
                Number(row.attack) || 0,

            kb:
                Number(row.kb) || 0,

            attackFrequency:
                Number(row.attackFrequency) || 0,

            attackInterval:
                Number(row.attackInterval) || 0,

            speed:
                Number(row.speed) || 0,

            range:
                Number(row.range) || 0,

            attackType:
                String(row.attackType),

            money:
                Number(row.money) || 0,

            traits:
                splitValues(row.traits),

            description:
                String(row.description)

        };


        // 詳細画面を表示
        displayCharacter(character);

    })

    .catch(error => {

        console.error(error);

        detail.innerHTML = `

            <div class="no-result">

                Excelデータの読み込みに失敗しました。<br><br>

                ・Live Serverで開いているか<br>
                ・characters.xlsxが同じフォルダにあるか<br>
                ・Excelのシート名が「キャラクターデータ」か<br>
                ・SheetJSが読み込まれているか

            </div>

        `;

    });


// ==============================
// キャラクター詳細表示
// ==============================

function displayCharacter(character) {
    let multiplier = urlMultiplier;
    let showSeconds = false;


        // ==============================
    // 連続攻撃の攻撃力を倍率計算
    // ==============================
       function formatContinuousAttack(trait) {



        return trait.replace(
            /(\d+)連続攻撃[ \t]+((?:[0-9][0-9,]*(?:\.[0-9]+)?[ \t]*)+)/g,
            (match, countText, valuesText) => {

                const count = Number(countText);

                const values = valuesText
                    .trim()
                    .split(/[ \t]+/);

                const scaledValues = values.map((value, index) => {

                    // 連続攻撃の回数分だけ倍率をかける
                    if (index >= count) {
                        return value;
                    }

                    const number = Number(
                        value.replace(/,/g, "")
                    );

                    if (!Number.isFinite(number)) {
                        return value;
                    }

                    const scaled =
                        Math.round(number * multiplier / 100);

                    return value.includes(",")
                        ? scaled.toLocaleString("en-US")
                        : String(scaled);

                });

                return `${count}連続攻撃 ${scaledValues.join(" ")}`;
            }
        );
    }

// ==============================
// F → 秒変換
// ==============================

function fToSeconds(f) {

    // 特性内のF表記を秒に変換
function formatFrameValues(text) {

    if (!showSeconds) {
        return text;
    }

    return text.replace(
        /(\d+(?:\.\d+)?)[FＦ]/g,
        (match, frame) => {
            return `${fToSeconds(frame).toFixed(2)}秒`;
        }
    );
}

    const frame = Number(f);

    if (!Number.isFinite(frame) || frame < 0) {
        return 0;
    }

    return frame * 0.033333;
}

    // ==============================
    // DPS計算
    // ==============================

    function calculateDPS() {
    const attack =
        character.attack *
        multiplier /
        100;

    const frequency =
        Number(character.attackFrequency);

    if (!frequency || frequency === 0) {
        return 0;
    }

    const frequencySeconds = frequency * 0.033333;

    return Math.round(
        attack / frequencySeconds
    );
}


    // ==============================
    // 画面を描画
    // ==============================

    function render() {

        // 倍率をHPに反映
        const hp =
            Math.round(
                character.hp *
                multiplier /
                100
            );


        // 倍率を攻撃力に反映
        const attack =
            Math.round(
                character.attack *
                multiplier /
                100
            );


        // DPS
        const dps =
            calculateDPS();

                    const formattedTraits =
    character.traits.map(trait =>
        formatFrameValues(
            formatContinuousAttack(trait)
        )
    );


        // ==============================
        // 属性アイコン
        // ==============================

        const attributeHtml =
            character.attributes

                .map(attribute => {

                    const data =
                        attributeIcons[attribute];

                    if (!data) {
                        return "";
                    }

                    return `

                        <div class="attribute-item">

                            <img
                                src="${data.image}"
                                alt="${data.name}"
                            >

                        </div>

                    `;

                })

                .join("");


        // ==============================
        // HTMLを表示
        // ==============================

        detail.innerHTML = `

            <div class="enemy-table">


                <!-- ヘッダー -->

                <div class="enemy-header">

                    <div>
                        No.${character.number}
                    </div>

                    <div>
                        ${character.name}
                    </div>

                </div>


                <!-- メイン部分 -->

                <div class="enemy-main">


                    <!-- 属性 -->

                    <div class="enemy-attribute">

                        ${
                            attributeHtml
                            ||
                            "属性なし"
                        }

                    </div>


                    <!-- キャラクター画像 -->

                    <div class="enemy-picture">

                        ${
                            character.image

                            ?

                            `
                            <img
                                src="${character.image}"
                                alt="${character.name}"
                            >
                            `

                            :

                            "画像なし"
                        }

                    </div>


                    <!-- ステータス -->

                    <div class="enemy-stats">


                        <!-- 1行目 -->

                        <div class="stat-row">

                            <span class="stat-name">
                                体力
                            </span>

                            <strong class="stat-value">
                                ${hp}
                            </strong>


                            <span class="stat-name">
                                KB
                            </span>

                            <strong class="stat-value">
                                ${character.kb}
                            </strong>


                            <span class="stat-name">
                                攻撃頻度
                            </span>

                            <strong class="stat-value">
                              ${showSeconds
    ? `${fToSeconds(character.attackFrequency).toFixed(2)}秒`
    : `${character.attackFrequency}F`
}
                            </strong>

                        </div>


                        <!-- 2行目 -->

                        <div class="stat-row">

                            <span class="stat-name">
                                攻撃力
                            </span>

                            <strong class="stat-value">
                                ${attack}
                            </strong>


                            <span class="stat-name">
                                速度
                            </span>

                            <strong class="stat-value">
                                ${character.speed}
                            </strong>


                            <span class="stat-name">
                                攻撃発生
                            </span>

                           
                                <strong class="stat-value">
    ${showSeconds
    ? `${fToSeconds(character.attackInterval).toFixed(2)}秒`
    : `${character.attackInterval}F`
}
</strong>
</div>

                        


                        <!-- 3行目 -->

                        <div class="stat-row">

                            <span class="stat-name">
                                DPS
                            </span>

                            <strong class="stat-value">
                                ${dps}
                            </strong>


                            <span class="stat-name">
                                射程
                            </span>

                            <strong class="stat-value">
                                ${character.range}
                            </strong>

                        </div>


                        <!-- 4行目 -->

                        <div class="stat-row">

                            <span class="stat-name">
                                範囲
                            </span>

                            <strong class="stat-value">
                                ${character.attackType}
                            </strong>


                            <span class="stat-name">
                                お金
                            </span>

                            <strong class="stat-value">
                                ${character.money}
                            </strong>

                        </div>


                    </div>

                </div>


                <!-- ========================= -->
                <!-- 強さ倍率 -->
                <!-- ========================= -->

                <div class="enemy-multiplier">

                    <div class="multiplier-title">
                        強さ倍率
                    </div>


                    <div class="multiplier-control">

                        <input
                        type="text"
                            id="multiplierInput"
                            value="${multiplier}"
                            min="1"
                            step="1"
                        >

                        <span>%</span>

                        <button id="frameToggleButton" class="frame-toggle">
    ${showSeconds ? "F表示に切り替え" : "秒表示に切り替え"}
</button>

                    </div>

                </div>

<div class="enemy-section mobile-only-section">
    <div class="section-title">お金</div>
    <div class="section-content">${character.money}円</div>
</div>

<div class="enemy-section mobile-only-section">
    <div class="section-title">攻撃特性</div>
    <div class="section-content">${character.attackType || "-"}</div>
</div>

<div class="enemy-section mobile-only-section">
    <div class="section-title">効果/能力</div>
    <div class="section-content">${formattedTraits.length ? formattedTraits.join(" / ") : "なし"}</div>
</div>

                <!-- ========================= -->
                <!-- 特性 -->
                <!-- ========================= -->

                <div class="enemy-section desktop-trait">

                    <div class="section-title">
                        特性
                    </div>

                   <div class="section-content">${formattedTraits.length === 0 ? "-" : formattedTraits.join(" / ")}</div>

                </div>


                <!-- ========================= -->
                <!-- 解説 -->
                <!-- ========================= -->

                <div class="enemy-section">

                    <div class="section-title">
                        解説
                    </div>

                   <div class="section-content description">${(character.description || "-").trim().replace(/\r?\n/g, "<br>")}</div>

                </div>


            </div>

        `;


        // ==============================
        // 倍率入力
        // ==============================

        const multiplierInput =
            document.getElementById(
                "multiplierInput"
            );

            const frameToggleButton =
    document.getElementById("frameToggleButton");

frameToggleButton.addEventListener(
    "click",
    () => {

        showSeconds = !showSeconds;

        render();

    }
);

       multiplierInput.addEventListener(
    "blur",
    () => {

        let value =
            multiplierInput.value
                .trim()
                .replace(/[０-９]/g, char =>
                    String.fromCharCode(
                        char.charCodeAt(0) - 0xFEE0
                    )
                );

        if (/^[0-9]+$/.test(value)) {

            multiplier =
                Number(value);

            multiplierInput.value =
                value;

        } else {

            multiplier = 100;

            multiplierInput.value =
                "100";

        }

        render();

    }
);

    }


    // 最初は100%
    render();

}