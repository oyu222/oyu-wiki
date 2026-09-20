// ========================================
// お湯Wiki
// キャラクター図鑑
// Excel直接読み込み版
// ========================================


// ========================================
// HTML要素
// ========================================

const attributeButtons =
    document.querySelectorAll(".attribute-button");

const characterList =
    document.getElementById("characterList");

const nameSearch =
    document.getElementById("nameSearch");


// ========================================
// データ
// ========================================

let characters = [];

let selectedAttributes = [];


// ========================================
// 検索方式
// ========================================

// "and" または "or"
let searchMode = "and";


// ========================================
// ページネーション
// ========================================

const charactersPerPage = 20;

let currentPage = 1;



// ========================================
// 詳細ページから戻ってきたときの状態復元
// ========================================

const returnParams =
    new URLSearchParams(
        window.location.search
    );

const returnPage =
    Number(
        returnParams.get("returnPage")
    );

const returnAttributes =
    returnParams.get("returnAttributes");

const returnMode =
    returnParams.get("returnMode");

const returnName =
    returnParams.get("returnName");

if (returnPage >= 1) {
    currentPage = returnPage;
}

if (returnAttributes) {
    selectedAttributes =
        returnAttributes
            .split(",")
            .filter(value => value !== "");
}

if (
    returnMode === "and" ||
    returnMode === "or"
) {
    searchMode = returnMode;
}

if (returnName !== null) {
    nameSearch.value = returnName;
}

attributeButtons.forEach(
    button => {

        if (
            selectedAttributes.includes(
                button.dataset.attribute
            )
        ) {
            button.classList.add(
                "selected"
            );
        }

    }
);

// ========================================
// 属性名
// ========================================

const attributeNames = {

    none: "無属性",
    red: "赤い敵",
    floating: "浮いてる敵",
    black: "黒い敵",
    metal: "メタル",
    angel: "天使",
    alien: "エイリアン",
    zombie: "ゾンビ",
    ancient: "古代種",
    devil: "悪魔",
    witch: "魔女",
    apostle: "使徒",
    starAlien: "スターエイリアン",
    superLife: "超生命体",
    beast: "超獣",
    sage: "超賢者",
    villain: "怪人",
    custom: "お湯キャラ"

};


// ========================================
// Excel内の
// 「赤,黒」のようなデータを配列にする
// ========================================

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


// ========================================
// 検索方式ボタンを作る
// ========================================

const searchModeBox =
    document.createElement("div");

searchModeBox.className =
    "search-mode-box";

searchModeBox.innerHTML = `

    <span class="search-mode-title">
        属性検索：
    </span>

    <button
        id="andSearchButton"
        class="search-mode-button selected"
    >
        AND検索
    </button>

    <button
        id="orSearchButton"
        class="search-mode-button"
    >
        OR検索
    </button>

`;


// 属性ボックスの後ろに追加
const attributeBox =
    document.querySelector(".attribute-box");

attributeBox.after(searchModeBox);


// ========================================
// 検索方式ボタン
// ========================================

const andSearchButton =
    document.getElementById("andSearchButton");

const orSearchButton =
    document.getElementById("orSearchButton");

    

andSearchButton.addEventListener(
    "click",
    () => {

        searchMode = "and";

        andSearchButton.classList.add("selected");
        orSearchButton.classList.remove("selected");

        currentPage = 1;

        filterCharacters();

    }
);


orSearchButton.addEventListener(
    "click",
    () => {

        searchMode = "or";

        orSearchButton.classList.add("selected");
        andSearchButton.classList.remove("selected");

        currentPage = 1;

        filterCharacters();

    }
);


// ========================================
// Excel読み込み
// ========================================

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

        const workbook =
            XLSX.read(buffer);


        const worksheet =
            workbook.Sheets["キャラクターデータ"];


        if (!worksheet) {

            throw new Error(
                "「キャラクターデータ」シートが見つかりません"
            );

        }


        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: ""
                }
            );


        // ========================================
        // Excel → JavaScript
        // ========================================

        characters =
            rows.map(row => {

                return {

                    id:
                        Number(row.id),

                    number:
                        String(row.number),

                    name:
                        String(row.name),

                    type:
                        String(row.type),

                    image:
                        String(row.image),

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

            });


        // ========================================
        // 読み込み完了
        // ========================================

        filterCharacters();

    })

    .catch(error => {

        console.error(error);

        characterList.innerHTML = `

            <div class="no-result">

                Excelデータの読み込みに失敗しました。<br><br>

                Live Serverで開いているか確認してください。

            </div>

        `;

    });


// ========================================
// 属性ボタン
// ========================================

attributeButtons.forEach(button => {

    button.addEventListener(
        "click",
        () => {

            const attribute =
                button.dataset.attribute;


            if (
                selectedAttributes.includes(attribute)
            ) {

                selectedAttributes =
                    selectedAttributes.filter(
                        item =>
                            item !== attribute
                    );

                button.classList.remove(
                    "selected"
                );

            } else {

                selectedAttributes.push(
                    attribute
                );

                button.classList.add(
                    "selected"
                );

            }


            // 条件を変更したので1ページ目へ
            currentPage = 1;

            filterCharacters();

        }
    );

});


// ========================================
// 名前検索
// ========================================

nameSearch.addEventListener(
    "input",
    () => {

        currentPage = 1;

        filterCharacters();

    }
);


// ========================================
// キャラクターを絞り込む
// ========================================

// ========================================
// 属性の上位互換を考慮
// ========================================

function hasAttribute(character, attribute) {

    // エイリアンにはスターエイリアンも含める
    if (attribute === "alien") {

        return (
            character.attributes.includes("alien") ||
            character.attributes.includes("starAlien")
        );

    }

    return character.attributes.includes(attribute);
}

function filterCharacters() {

    const keyword =
        nameSearch.value
            .trim()
            .toLowerCase();


    const results =
        characters.filter(character => {


            // ========================================
            // 名前検索
            // ========================================

            const nameMatch =

                keyword === ""

                ||

                character.name
                    .toLowerCase()
                    .includes(keyword);


            if (!nameMatch) {
                return false;
            }


            // ========================================
            // 属性検索
            // ========================================

            // 属性を選択していない
            if (
                selectedAttributes.length === 0
            ) {

                return true;

            }


            // ========================================
            // AND検索
            // ========================================

            if (searchMode === "and") {

                return selectedAttributes.every(
    attribute =>
        hasAttribute(character, attribute)
);

            }


            // ========================================
            // OR検索
            // ========================================

            if (searchMode === "or") {

                return selectedAttributes.some(
    attribute =>
        hasAttribute(character, attribute)
);

            }


            return true;

        });


    displayCharacters(results);

}


// ========================================
// キャラクター表示
// ========================================

function displayCharacters(results) {

    characterList.innerHTML = "";


    // ========================================
    // 該当なし
    // ========================================

    if (results.length === 0) {

        characterList.innerHTML = `

            <div class="no-result">

                該当するキャラクターはいません

            </div>

        `;

        return;

    }


    // ========================================
    // ページ数
    // ========================================

    const totalPages =
        Math.ceil(
            results.length /
            charactersPerPage
        );


    // 現在ページが範囲外にならないようにする
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }


    // ========================================
    // 表示する範囲
    // ========================================

    const startIndex =
        (currentPage - 1) *
        charactersPerPage;


    const endIndex =
        startIndex +
        charactersPerPage;


    const pageResults =
        results.slice(
            startIndex,
            endIndex
        );


    // ========================================
    // キャラクター
    // ========================================

    pageResults.forEach(character => {

        const row =
            document.createElement("a");


        row.className =
            "character-row";


        const returnParams =
    new URLSearchParams();

returnParams.set(
    "returnPage",
    currentPage
);

returnParams.set(
    "returnAttributes",
    selectedAttributes.join(",")
);

returnParams.set(
    "returnMode",
    searchMode
);

returnParams.set(
    "returnName",
    nameSearch.value
);

row.href =
    `character.html?id=${character.id}&${returnParams.toString()}`;


        const attributeText =
            character.attributes
                .map(
                    attribute =>
                        attributeNames[attribute]
                        || attribute
                )
                .join(" / ");


        row.innerHTML = `

    <div class="character-id">

        No.${character.number}

    </div>


    <div class="character-image">

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


    <div class="character-name">

        ${character.name}

    </div>


    <div class="character-attributes">

        ${attributeText || "属性なし"}

    </div>

`;


        characterList.appendChild(row);

    });


    // ========================================
    // ページネーション
    // ========================================

    createPagination(
        results,
        totalPages
    );

}

// ========================================
// ページ切り替え
// ========================================

function createPagination(results, totalPages) {

    // ========================================
    // 上側ページネーション
    // ========================================

    const topContainer =
        document.getElementById("paginationTop");

    // 上側を一度空にする
    if (topContainer) {
        topContainer.innerHTML = "";
    }


    // ========================================
    // 1ページしかない場合
    // ========================================

    if (totalPages <= 1) {
        return;
    }


    // ========================================
    // ページネーションを作る関数
    // ========================================

    function buildPagination() {

        const pagination =
            document.createElement("div");

        pagination.className = "pagination";


        // ========================================
        // 前へ
        // ========================================

        const previousButton =
            document.createElement("button");

        previousButton.textContent = "前";

        previousButton.disabled =
            currentPage === 1;

        previousButton.addEventListener(
            "click",
            () => {

                if (currentPage > 1) {

                    currentPage--;

                    displayCharacters(results);

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }

            }
        );

        pagination.appendChild(previousButton);


        // ========================================
        // ページ番号
        // ========================================

        const pages =
            createPageNumbers(totalPages);


        pages.forEach(page => {

            // 「...」
            if (page === "...") {

                const dots =
                    document.createElement("span");

                dots.className =
                    "pagination-dots";

                dots.textContent =
                    "...";

                pagination.appendChild(dots);

                return;
            }


            // ページ番号ボタン
            const button =
                document.createElement("button");

            button.textContent =
                page;


            // 現在のページ
            if (page === currentPage) {

                button.classList.add(
                    "current"
                );

            }


            button.addEventListener(
                "click",
                () => {

                    currentPage =
                        page;

                    displayCharacters(results);

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }
            );


            pagination.appendChild(button);

        });


        // ========================================
        // 次へ
        // ========================================

        const nextButton =
            document.createElement("button");

        nextButton.textContent = "次";

        nextButton.disabled =
            currentPage === totalPages;

        nextButton.addEventListener(
            "click",
            () => {

                if (
                    currentPage <
                    totalPages
                ) {

                    currentPage++;

                    displayCharacters(results);

                    window.scrollTo({
                        top: 0,
                        behavior: "smooth"
                    });

                }

            }
        );

        pagination.appendChild(nextButton);


        return pagination;

    }


    // ========================================
    // 上側
    // ========================================

    if (topContainer) {

        topContainer.appendChild(
            buildPagination()
        );

    }


    // ========================================
    // 下側
    // ========================================

    const bottomPagination =
        buildPagination();

    characterList.appendChild(
        bottomPagination
    );

}


// ========================================
// ページ番号を作る
// ========================================

function createPageNumbers(totalPages) {

    const pages = [];


    // 7ページ以下なら全部表示
    if (totalPages <= 7) {

        for (
            let i = 1;
            i <= totalPages;
            i++
        ) {

            pages.push(i);

        }

        return pages;

    }


    // ========================================
    // 8ページ以上
    // ========================================

    pages.push(1);


    if (currentPage > 4) {

        pages.push("...");

    }


    const start =
        Math.max(
            2,
            currentPage - 1
        );


    const end =
        Math.min(
            totalPages - 1,
            currentPage + 1
        );


    for (
        let i = start;
        i <= end;
        i++
    ) {

        pages.push(i);

    }


    if (
        currentPage <
        totalPages - 3
    ) {

        pages.push("...");

    }


    pages.push(
        totalPages
    );


    return pages;

}