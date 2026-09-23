const KEY = "oyuWikiStages";

const params = new URLSearchParams(location.search);

const editId = params.get("id");

const STORAGE_KEY = "oyuWikiStages";

let mapTypes = [];

let chapters = [];

let selectedMapTypeIndex = 0;

let selectedCharacterId = null;

let selectedAttributes = [];

async function loadSavedStages() {

    const { data, error } =
        await supabaseClient
            .from("stage_data")
            .select("chapters, map_types")
            .eq("id", "main")
            .maybeSingle();

    if (error) {

        console.error(
            "Supabase読み込みエラー:",
            error
        );

        return {
            chapters: [],
            mapTypes: []
        };

    }

    return {

        chapters:
            Array.isArray(data?.chapters)
                ? data.chapters
                : [],

        mapTypes:
            Array.isArray(data?.map_types)
                ? data.map_types
                : []

    };

}



if (chapters.length === 0) {
    chapters = [
        {
            id: "chapter_1",
            name: "第1章",
            stages: [
                {
                    id: "stage_1",
                    name: "ステージ1",

                    description: "",
castleHealth: 10000,
castleWidth: 3000,
maxEnemies: 8,
spawnRestriction: "",
enemyLimit: 0,
waves: [[]]
                }
            ]
        }
    ];
}


let selectedChapterIndex = 0;

let selectedStageIndex = 0;

let activeWave = 0;

let stageId = null;


// =========================
// 共通
// =========================

function $(id) {

    return document.getElementById(id);

}

// =========================
// 属性フィルター
// =========================

const attributeNames = {

    none: "無",
    red: "赤",
    floating: "浮",
    black: "黒",
    metal: "鉄",
    angel: "天",
    alien: "エ",
    zombie: "ゾ",
    ancient: "古",
    devil: "悪",
    witch: "魔",
    apostle: "使",
    starAlien: "星エ",
    superLife: "生",
    beast: "獣",
    sage: "賢",
    villain: "怪",
    custom: "湯"

};

function renderAttributeFilters() {

    const attributes = [
        ...new Set(
            characters.flatMap(
                character => character.attributes || []
            )
        )
    ];

    $("attributeFilterList").innerHTML =
        attributes.map(attribute => `

            <label>
                <input
                    type="checkbox"
                    value="${esc(attribute)}"
                    data-attribute-filter
                >
               ${esc(attributeNames[attribute] || attribute)}
            </label>

        `).join("");

    document
        .querySelectorAll("[data-attribute-filter]")
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    selectedAttributes =
                        Array.from(
                            document.querySelectorAll(
                                "[data-attribute-filter]:checked"
                            )
                        ).map(
                            input => input.value
                        );

                    renderCharacters();

                }
            );

        });

}

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

function esc(value) {

    return String(value).replace(
        /[&<>'"]/g,
        c => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            "'": "&#39;",
            '"': "&quot;"
        }[c])
    );

}

async function initializeStages() {

    const savedData =
        await loadSavedStages();


    // 新しいマップ種類データがある場合
    if (
        Array.isArray(savedData.mapTypes) &&
        savedData.mapTypes.length > 0
    ) {

        mapTypes =
            savedData.mapTypes;

    }

    // まだマップ種類データがない場合
    else {

        const legacyChapters =
            savedData.chapters.length > 0
                ? savedData.chapters
                : chapters;

        mapTypes = [

            {
                id: "map_legacy",

                name: "お湯レジェンド",

                chapters:
                    legacyChapters
            }

        ];

    }


    // 最初のマップ種類を選択
    selectedMapTypeIndex = 0;


    chapters =
        mapTypes[0]?.chapters || [];


    renderAll();

}

// =========================
// 現在のステージ
// =========================

function getCurrentStage() {

    return chapters[
        selectedChapterIndex
    ]?.stages[
        selectedStageIndex
    ];

}


// =========================
// マップ種類表示
// =========================

function renderMapTypes() {

    $("mapTypeList").innerHTML =
        mapTypes.map(
            (mapType, index) => `

                <button
                    type="button"
                    class="
                        stage-side-item
                        ${
                            index === selectedMapTypeIndex
                                ? "selected"
                                : ""
                        }
                    "
                    data-map-type="${index}"
                >

                    ${esc(mapType.name)}

                </button>

            `
        ).join("");


    document
        .querySelectorAll(
            "#mapTypeList [data-map-type]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedMapTypeIndex =
                        Number(
                            button.dataset.mapType
                        );


                    chapters =
                        mapTypes[
                            selectedMapTypeIndex
                        ].chapters;


                    selectedChapterIndex = 0;

                    selectedStageIndex = 0;

                    activeWave = 0;

                    selectedLineIndex = null;


                    loadCurrentStage();

                    renderAll();

                }
            );

        });

}


// =========================
// 章表示
// =========================

function renderChapters() {

    $("chapterList").innerHTML =
        chapters.map(
            (chapter, index) => `

                <button
                    type="button"
                    class="
                        stage-side-item
                        ${
                            index === selectedChapterIndex
                                ? "selected"
                                : ""
                        }
                    "
                    data-chapter="${index}"
                >

                    ${esc(chapter.name)}

                </button>

            `
        ).join("");


    document
        .querySelectorAll("[data-chapter]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedChapterIndex =
                        Number(
                            button.dataset.chapter
                        );

                    selectedStageIndex = 0;

                    activeWave = 0;

                    renderAll();

                }
            );

        });

}


// =========================
// ステージ表示
// =========================

function renderStages() {

    const chapter =
        chapters[selectedChapterIndex];


    if (!chapter) return;


    $("stageList").innerHTML =
        chapter.stages.map(
            (stage, index) => `

                <button
                    type="button"
                    class="
                        stage-side-item
                        ${
                            index === selectedStageIndex
                                ? "selected"
                                : ""
                        }
                    "
                    data-stage="${index}"
                >

                    ${esc(stage.name)}

                </button>

            `
        ).join("");


    document
        .querySelectorAll("[data-stage]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectedStageIndex =
                        Number(
                            button.dataset.stage
                        );

                    activeWave = 0;
                    selectedLineIndex = null;

async function loadSavedStage() {
    if (!editId) return false;

    const stages = await loadSavedStages();

    if (!Array.isArray(stages)) {
        return false;
    }

    const stage = stages.find(
        s => String(s.id) === String(editId)
    );

    if (!stage) return false;

    chapters = [
        {
            id: "chapter_edit",
            name: "ステージ",
            stages: [
                {
                    ...stage,
                    waves:
                        stage.waves?.length
                            ? stage.waves
                            : [[]]
                }
            ]
        }
    ];

    selectedChapterIndex = 0;
    selectedStageIndex = 0;
    activeWave = 0;

    loadCurrentStage();

    return true;
}

                    loadCurrentStage();

                    renderAll();

                }
            );

        });

}


// =========================
// 現在のステージ読み込み
// =========================

function loadCurrentStage() {

    const stage =
        getCurrentStage();

    if (!stage) return;

    stageId = stage.id;

    $("stageName").value =
        stage.name || "";

        $("castleHealth").value =
    stage.castleHealth ?? 10000;

    $("leadership").value =
    stage.leadership ?? 0;

    $("stageWidth").value =
        stage.castleWidth ?? 3000;

    $("maxEnemies").value =
        stage.maxEnemies ?? 8;

    $("spawnRestriction").value =
        stage.spawnRestriction ?? "";

    activeWave = 0;

    selectedLineIndex = null;
}


// =========================
// キャラクター検索
// =========================

function renderCharacters() {

    const query =
        $("characterSearch")
            .value
            .trim()
            .toLowerCase();


    const result =
    characters
        .filter(character => {

            const nameMatch =
                String(character.name || "")
                    .toLowerCase()
                    .includes(query);

            const attributeMatch =
                selectedAttributes.length === 0 ||
                selectedAttributes.every(
                    attribute =>
                        (character.attributes || [])
                            .includes(attribute)
                );

            return nameMatch && attributeMatch;

        });
            


    $("characterList").innerHTML =
        result.length

            ? result
                .map(character => `

                    <button
                        type="button"
                        class="
                            stage-character-item
                            ${
                                Number(character.id) ===
                                Number(selectedCharacterId)
                                    ? "selected"
                                    : ""
                            }
                        "
                        data-character-id="${Number(character.id)}"
                    >

                        ${
                            character.image
                                ? `
                                    <img
                                        src="${esc(character.image)}"
                                        alt=""
                                        onerror="
                                            this.style.visibility='hidden'
                                        "
                                    >
                                `
                                : ""
                        }


                        <span>

                            <strong>
                                ${esc(character.name)}
                            </strong>

                            <small>
                                No.${esc(character.number ?? character.id)}
                            </small>

                        </span>

                    </button>

                `)
                .join("")

            :

                `
                    <div class="stage-muted">
                        該当するキャラクターがありません。
                    </div>
                `;


    document
        .querySelectorAll("[data-character-id]")
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    selectCharacter(
                        Number(
                            button.dataset.characterId
                        )
                    );

                }
            );

        });

}


// =========================
// キャラクター選択
// =========================

function selectCharacter(id) {

    selectedCharacterId =
        Number(id);


    const character =
        characters.find(
            c =>
                Number(c.id) ===
                selectedCharacterId
        );


    if (!character) return;


    $("addLine").disabled =
        false;


    renderCharacters();

}


// =========================
// 新ライン
// =========================

function addLine() {

    if (
        selectedCharacterId === null
    ) {

        alert(
            "先にキャラクターを選択してください。"
        );

        return;

    }


    const stage =
        getCurrentStage();


    if (!stage) return;


    if (!stage.waves) {

        stage.waves = [[]];

    }


    if (
        !stage.waves[activeWave]
    ) {

        stage.waves[activeWave] = [];

    }


    stage.waves[activeWave].push({

    enemyId: selectedCharacterId,

    boss: false,

    multiplier: 100,

    count: 1,

    castleLink: 100,

    time: 0,

    respawn: 0,


});

    selectedLineIndex =
    stage.waves[activeWave].length - 1;

    renderAll();

}


// =========================
// ウェーブ
// =========================

// =========================
// ライン並び替え
// =========================

function moveLine(direction) {

    const stage = getCurrentStage();

    if (!stage) return;

    const lines = stage.waves?.[activeWave];

    if (!lines) return;

    if (selectedLineIndex === null) {
        alert("並び替えるラインを選択してください。");
        return;
    }

    const from = selectedLineIndex;
    const to = from + direction;

    if (to < 0 || to >= lines.length) {
        return;
    }

    [lines[from], lines[to]] =
        [lines[to], lines[from]];

    selectedLineIndex = to;

    renderAll();
}

// =========================
// ライン
// =========================

function renderSpawnLines() {

    const stage = getCurrentStage();

    if (!stage) return;

    const lines =
        stage.waves?.[activeWave] || [];


    if (!lines.length) {

        $("spawnList").innerHTML = `
            <tr>
                <td colspan="11" class="stage-empty-line">
                    キャラクターを選択して「新ライン」を押してください。
                </td>
            </tr>
        `;

        return;
    }


    $("spawnList").innerHTML =
        lines.map((line, index) => {

            const character =
                characters.find(
                    c =>
                        Number(c.id) ===
                        Number(line.enemyId)
                );


            return `
                <tr
                    data-line-index="${index}"
                    class="${
                        index === selectedLineIndex
                            ? "selected"
                            : ""
                    }"
                >

                    <td>
                        <input
                            type="checkbox"
                            data-field="boss"
                            data-index="${index}"
                            ${line.boss ? "checked" : ""}
                        >
                    </td>


                    <td>

                       <div class="stage-line-character">

    ${
        character?.image
            ? `
                <img
                    src="${esc(character.image)}"
                    alt=""
                >
            `
            : ""
    }

    <span>

        ${
            character
                ? `
                    <a
                        href="character.html?id=${encodeURIComponent(character.id)}&multiplier=${encodeURIComponent(line.multiplier ?? 100)}"
                        class="stage-character-link"
                        target="_blank"
                    >
                        <strong>
                            ${esc(character.name)}
                        </strong>
                    </a>
                `
                : `
                    <strong>
                        不明
                    </strong>
                `
        }

        <small>
            No.${esc(
                character?.number ??
                character?.id ??
                line.enemyId
            )}
        </small>

    </span>

</div>


                    <td>
    <div class="stage-unit-input">
        <input
            type="number"
            min="1"
            value="${line.multiplier ?? 100}"
            data-field="multiplier"
            data-index="${index}"
        >
        <span>%</span>
    </div>
</td>


                    <td>
                        <input
    type="text"
    value="${line.count ?? 1}"
    data-field="count"
    data-index="${index}"
>
                    </td>


                    <td>
    <div class="stage-unit-input">
        <input
            type="number"
            min="0"
            max="100"
            value="${line.castleLink ?? 100}"
            data-field="castleLink"
            data-index="${index}"
        >
        <span>%</span>
    </div>
</td>


                    <td>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value="${line.time ?? 0}"
                            data-field="time"
                            data-index="${index}"
                        >
                    </td>


                    <td>
                        <input
                            type="number"
                            min="0"
                            step="0.1"
                            value="${line.respawn ?? 0}"
                            data-field="respawn"
                            data-index="${index}"
                        >
                    </td>



                </tr>
            `;

        }).join("");


    // ライン選択
    document
        .querySelectorAll(
            "#spawnList tr[data-line-index]"
        )
        .forEach(row => {

           row.addEventListener("click", event => {
    if (event.target.closest("input")) return;

    selectedLineIndex =
        Number(row.dataset.lineIndex);

    renderSpawnLines();
});

        });


    // 入力変更
    document
        .querySelectorAll("[data-field]")
        .forEach(input => {

            input.addEventListener(
                "change",
                () => {

                    const index =
                        Number(
                            input.dataset.index
                        );

                    const field =
                        input.dataset.field;


                    if (
                        input.type === "checkbox"
                    ) {

                        lines[index][field] =
                            input.checked;

                    }

                    else if (field === "count") {
    const value = input.value.trim();

    if (value === "" || !/^\d+$/.test(value)) {
        lines[index][field] = "無制限";
    } else {
        lines[index][field] = Number(value);
    }

    renderSpawnLines();
}
else if (
    input.type === "number"
) {
    lines[index][field] =
        Number(
            input.value
        );

    renderSpawnLines();
}

                    else {

                        lines[index][field] =
                            input.value;

                    }

                }
            );

        });

}


// =========================
// プレビュー
// =========================


// =========================
// ステージ保存
// =========================

async function saveCurrentStage() {

    const stage =
        getCurrentStage();

    if (!stage) return;


    // 基本情報

    stage.name =
        $("stageName")
            .value
            .trim() ||
        "無題のステージ";

stage.castleHealth =
    Number(
        $("castleHealth").value
    ) || 10000;

    stage.leadership =
    Number(
        $("leadership").value
    ) || 0;

    stage.castleWidth =
        Number(
            $("stageWidth").value
        ) || 3000;


    stage.maxEnemies =
        Number(
            $("maxEnemies").value
        ) || 8;


    stage.spawnRestriction =
        $("spawnRestriction")
            .value;


    // 保存

   // Supabaseへ保存
const { error } = await supabaseClient
    .from("stage_data")
    .upsert({
        id: "main",

        // 旧ページとの互換用
        chapters:
            mapTypes[0]?.chapters || [],

        // 新しい本体データ
        map_types:
            mapTypes,

        updated_at:
            new Date().toISOString()
    });

if (error) {
    console.error("Supabase保存エラー:", error);
    $("status").innerHTML =
        `<span style="color:red;">保存に失敗しました</span>`;
    return;
}


    // 保存完了表示

    $("status").innerHTML =
        `<span class="stage-saved">
            保存しました！
        </span>`;


    setTimeout(
        () => {
            $("status").textContent = "";
        },
        1800
    );


    // 左側のステージ名を更新

    renderChapters();
    renderStages();
}


// =========================
// マップ種類追加
// =========================

function addMapType() {

    const name =
        prompt(
            "マップ種類の名前を入力してください。"
        );


    if (!name) return;


    const newMapType = {

        id:
            "map_" +
            Date.now(),

        name:
            name,

        chapters: [

            {

                id:
                    "chapter_" +
                    Date.now(),

                name:
                    "第1章",

                stages: [

                    {

                        id:
                            "stage_" +
                            Date.now(),

                        name:
                            "ステージ1",

                        description: "",

                        castleHealth:
                            10000,

                        castleWidth:
                            3000,

                        maxEnemies:
                            8,

                        spawnRestriction:
                            "",

                        enemyLimit:
                            0,

                        waves:
                            [[]]

                    }

                ]

            }

        ]

    };


    mapTypes.push(
        newMapType
    );


    selectedMapTypeIndex =
        mapTypes.length - 1;


    chapters =
        newMapType.chapters;


    selectedChapterIndex = 0;

    selectedStageIndex = 0;

    activeWave = 0;


    loadCurrentStage();

    renderAll();

}


// =========================
// マップ種類削除
// =========================

function deleteMapType() {

    if (mapTypes.length <= 1) {

        alert(
            "マップ種類は最低1つ必要です。"
        );

        return;

    }


    const mapType =
        mapTypes[
            selectedMapTypeIndex
        ];


    if (!mapType) return;


    if (
        !confirm(
            `「${mapType.name}」を削除しますか？`
        )
    ) {

        return;

    }


    mapTypes.splice(
        selectedMapTypeIndex,
        1
    );


    selectedMapTypeIndex =
        Math.min(
            selectedMapTypeIndex,
            mapTypes.length - 1
        );


    chapters =
        mapTypes[
            selectedMapTypeIndex
        ].chapters;


    selectedChapterIndex = 0;

    selectedStageIndex = 0;

    activeWave = 0;

    selectedLineIndex = null;


    loadCurrentStage();

    renderAll();

}

// =========================
// 章追加
// =========================

function addChapter() {

    const name =
        prompt(
            "章の名前を入力してください。"
        );


    if (!name) return;


    chapters.push({

        id:
            "chapter_" +
            Date.now(),

        name:
            name,

        stages: [

            {

                id:
                    "stage_" +
                    Date.now(),

                name:
                    "新しいステージ",

                description: "",

castleHealth:
    10000,

castleWidth:
    3000,

                maxEnemies:
                    50,

                spawnRestriction:
                    "none",

                enemyLimit:
                    0,

                waves:
                    [[]]

            }

        ]

    });


    selectedChapterIndex =
        chapters.length - 1;


    selectedStageIndex =
        0;


    renderAll();

}


// =========================
// ステージ追加
// =========================

function addStage() {

    const chapter =
        chapters[
            selectedChapterIndex
        ];


    if (!chapter) return;


    const name =
        prompt(
            "ステージの名前を入力してください。"
        );


    if (!name) return;


    chapter.stages.push({

        id:
            "stage_" +
            Date.now(),

        name:
            name,

        description: "",

castleHealth:
    10000,

castleWidth:
    3000,

        maxEnemies:
            50,

        spawnRestriction:
            "none",

        enemyLimit:
            0,

        waves:
            [[]]

    });


    selectedStageIndex =
        chapter.stages.length - 1;


    activeWave = 0;

    loadCurrentStage();

    renderAll();

}

// =========================
// 章削除
// =========================

function deleteChapter() {

    if (chapters.length <= 1) {
        alert("章は最低1つ必要です。");
        return;
    }

    const chapter =
        chapters[selectedChapterIndex];

    if (!chapter) return;

    if (
        !confirm(
            `「${chapter.name}」を削除しますか？`
        )
    ) {
        return;
    }

    chapters.splice(
        selectedChapterIndex,
        1
    );

    // 選択位置を調整
    selectedChapterIndex =
        Math.min(
            selectedChapterIndex,
            chapters.length - 1
        );

    selectedStageIndex = 0;
    activeWave = 0;
    selectedLineIndex = null;

    loadCurrentStage();
    renderAll();
}


// =========================
// ステージ削除
// =========================

function deleteStage() {

    const chapter =
        chapters[selectedChapterIndex];

    if (!chapter) return;

    if (chapter.stages.length <= 1) {
        alert(
            "ステージは最低1つ必要です。"
        );
        return;
    }

    const stage =
        chapter.stages[selectedStageIndex];

    if (!stage) return;

    if (
        !confirm(
            `「${stage.name}」を削除しますか？`
        )
    ) {
        return;
    }

    chapter.stages.splice(
        selectedStageIndex,
        1
    );

    // 選択位置を調整
    selectedStageIndex =
        Math.min(
            selectedStageIndex,
            chapter.stages.length - 1
        );

    activeWave = 0;
    selectedLineIndex = null;

    loadCurrentStage();
    renderAll();
}$("addChapter")

if (editId) {

    for (
        let c = 0;
        c < chapters.length;
        c++
    ) {

        const index =
            chapters[c].stages?.findIndex(
                stage =>
                    String(stage.id) ===
                    String(editId)
            );

        if (index >= 0) {

            selectedChapterIndex = c;

            selectedStageIndex = index;

            break;

        }

    }

}

// =========================
// 全体描画
// =========================
function renderAll() {

     renderMapTypes();

    renderChapters();

    renderStages();

    renderCharacters();

    renderSpawnLines();

}


// =========================
// イベント
// =========================

$("addMapType")
    .addEventListener(
        "click",
        addMapType
    );


$("deleteMapType")
    .addEventListener(
        "click",
        deleteMapType
    );

$("addChapter")
    .addEventListener(
        "click",
        addChapter
    );


$("addStage")
    .addEventListener(
        "click",
        addStage
    );

$("deleteChapter")
    .addEventListener(
        "click",
        deleteChapter
    );

$("deleteStage")
    .addEventListener(
        "click",
        deleteStage
    );

$("characterSearch")
    .addEventListener(
        "input",
        renderCharacters
    );


$("addLine")
    .addEventListener(
        "click",
        addLine
    );

$("copyLine")
    .addEventListener(
        "click",
        () => {

            const stage =
                getCurrentStage();

            if (!stage) return;


            if (
                selectedLineIndex === null
            ) {

                alert(
                    "コピーするラインを選択してください。"
                );

                return;

            }


            const lines =
                stage.waves[activeWave];


            const original =
                lines[selectedLineIndex];


            // ラインを複製
            const copiedLine = {
                ...original
            };


            // 選択中ラインの直後に追加
            lines.splice(
                selectedLineIndex + 1,
                0,
                copiedLine
            );


            // コピーしたラインを選択
            selectedLineIndex += 1;


            renderAll();

        }
    );

    $("moveLineUp")
    .addEventListener(
        "click",
        () => moveLine(-1)
    );

$("moveLineDown")
    .addEventListener(
        "click",
        () => moveLine(1)
    );

    $("deleteLine")
    .addEventListener(
        "click",
        () => {

            const stage =
                getCurrentStage();

            if (!stage) return;

            if (
                selectedLineIndex === null
            ) {

                alert(
                    "削除するラインを選択してください。"
                );

                return;

            }

            stage.waves[activeWave]
                .splice(
                    selectedLineIndex,
                    1
                );

            selectedLineIndex = null;

            renderAll();

        }
    );

$("save")
    .addEventListener(
        "click",
        saveCurrentStage
    );


// ========================================
// キャラクター読み込み
// ========================================

if (!editId) {
    loadCurrentStage();
}

fetch("characters.xlsx")
    .then(response => {

        if (!response.ok) {
            throw new Error(
                "characters.xlsx を読み込めませんでした"
            );
        }

        return response.arrayBuffer();

    })
    .then(buffer => {

        const workbook = XLSX.read(buffer);


        // キャラクターデータシート
        const worksheet =
            workbook.Sheets["キャラクターデータ"];


        if (!worksheet) {
            throw new Error(
                "「キャラクターデータ」シートが見つかりません"
            );
        }


        // Excel → 配列
        const rows =
            XLSX.utils.sheet_to_json(
                worksheet,
                {
                    defval: ""
                }
            );


        // キャラクターデータ
        characters =
            rows
                .map(row => {

                    return {

                        id:
                            Number(row.id),

                        number:
                            String(row.number),

                        name:
                            String(row.name),

                        image:
                            String(row.image),

                            attributes:
    splitValues(row.attributes),

                    };

                })
                .filter(character => {

                    return (
                        character.name &&
                        character.name !== "undefined"
                    );

                });


        console.log(
            "キャラクター読み込み完了：",
            characters.length
        );


        // 最初の表示
       renderAttributeFilters();
renderCharacters();

initializeStages().then(() => {
    if (editId) {
        loadCurrentStage();
    }
});

    })
    .catch(error => {

        console.error(
            "キャラクター読み込みエラー：",
            error
        );


        $("characterList").innerHTML = `

            <div class="stage-muted">

                キャラクターの読み込みに失敗しました。

                <br><br>

                ${esc(error.message)}

            </div>

        `;

    });