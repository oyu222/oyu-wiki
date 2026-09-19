// ====================
// キャラクター詳細
// ====================

const params = new URLSearchParams(window.location.search);
const id = Number(params.get("id"));
const urlMultiplier = Number(params.get("multiplier")) || 100;

const detail =
    document.getElementById("characterDetail");


// ====================
// 属性アイコン
// ====================

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


// ====================
// JSON読み込み
// ====================

fetch("characters.json")

    .then(response => {

        if (!response.ok) {
            throw new Error(
                "characters.jsonを読み込めませんでした"
            );
        }

        return response.json();
    })

    .then(characters => {

        const character =
            characters.find(
                character => character.id === id
            );

        if (!character) {

            detail.innerHTML = `
                <div class="no-result">
                    キャラクターが見つかりません。
                </div>
            `;

            return;
        }

        displayCharacter(character);
    })

    .catch(error => {

        console.error(error);

        detail.innerHTML = `
            <div class="no-result">
                キャラクターデータの読み込みに失敗しました。
            </div>
        `;
    });


// ====================
// キャラクター表示
// ====================

function displayCharacter(character) {
    let multiplier = urlMultiplier;


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

        return Math.floor(
            attack / frequency
        );
    }


    function render() {

        const hp =
            Math.round(
                character.hp *
                multiplier /
                100
            );

        const attack =
            Math.round(
                character.attack *
                multiplier /
                100
            );

        const dps =
            calculateDPS();


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

                            <span>
                                ${data.name}
                            </span>

                        </div>
                    `;
                })
                .join("");


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


                <!-- メイン -->

                <div class="enemy-main">


                    <!-- 属性 -->

                    <div class="enemy-attribute">

                        ${attributeHtml}

                    </div>


                    <!-- 画像 -->

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

    <div class="stat-row">

        <span class="stat-name">
            体力
        </span>

        <strong class="stat-value">
            ${hp}
        </strong>

        <span class="stat-name">
            攻撃力
        </span>

        <strong class="stat-value">
            ${attack}
        </strong>

    </div>


    <div class="stat-row">

        <span class="stat-name">
            DPS
        </span>

        <strong class="stat-value">
            ${dps}
        </strong>

        <span class="stat-name">
            KB
        </span>

        <strong class="stat-value">
            ${character.kb}
        </strong>

    </div>


    <div class="stat-row">

        <span class="stat-name">
            速度
        </span>

        <strong class="stat-value">
            ${character.speed}
        </strong>

        <span class="stat-name">
            射程
        </span>

        <strong class="stat-value">
            ${character.range}
        </strong>

    </div>


    <div class="stat-row">

        <span class="stat-name">
            攻撃頻度
        </span>

        <strong class="stat-value">
            ${character.attackFrequency}秒
        </strong>

        <span class="stat-name">
            攻撃発生
        </span>

        <strong class="stat-value">
            ${character.attackInterval}秒
        </strong>

    </div>

</div>

                </div>



<!-- お金 -->

<div class="enemy-section">

    <div class="section-title">
        お金
    </div>

    <div class="section-content">
        ${character.money}
    </div>

</div>


                <!-- 強さ倍率 -->

                <div class="enemy-multiplier">

                    <div class="multiplier-title">
                        強さ倍率
                    </div>

                    <div class="multiplier-control">

                        <input
                            type="number"
                            id="multiplierInput"
                            value="${multiplier}"
                            min="1"
                            step="1"
                        >

                        <span>%</span>

                    </div>

                </div>


                <!-- 特性 -->

                <div class="enemy-section">

                    <div class="section-title">
                        特性
                    </div>

                    <div class="section-content">

                        <div class="section-content">${character.traits.length === 0 ? "-" : character.traits.join(" / ")}</div>

                    </div>

                </div>


                <!-- 解説 -->

                <div class="enemy-section">

                    <div class="section-title">
                        解説
                    </div>

                   <div class="section-content description">${character.description || "-"}</div>

                </div>


            </div>

        `;


        // ====================
        // 倍率入力
        // ====================

        const multiplierInput =
            document.getElementById(
                "multiplierInput"
            );


        multiplierInput.addEventListener(
            "input",
            () => {

                let value =
                    Number(
                        multiplierInput.value
                    );


                if (
                    isNaN(value) ||
                    value < 1
                ) {

                    value = 1;

                }


                multiplier = value;

                render();

            }
        );

    }


    render();
}