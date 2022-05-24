/**
 *  @author kiwi
 *  @date 2022.05.22
 *
 *
 *  ☒ display 7 mana symbols
 *  ☒ toggle mana symbol highlight with keyboard input: cwubrg
 *      clean up
 *  ☒ see mana font css to get correct colors
 *      c: beb9b2
 *      w: f0f2c0
 *      u: b5cde3
 *      b: aca29a
 *      r: db8664
 *      g: 93b483
 *  ☐ add JSON
 */

let font
let instructions
let debugCorner /* output debug text in the bottom left corner of the canvas */

let w, u, b, r, g, c, p
let strip /* color selector UI. a mana symbol is highlighted when selected */

let scryfall /* json file from scryfall: set=snc */
let cards /* packed up JSON data */

function preload() {
    font = loadFont('data/consola.ttf')
    w = loadImage('svg/w.svg')
    u = loadImage('svg/u.svg')
    b = loadImage('svg/b.svg')
    r = loadImage('svg/r.svg')
    g = loadImage('svg/g.svg')
    p = loadImage('svg/p.svg')
    c = loadImage('svg/c.svg')

    scryfall = loadJSON('scryfall-snc.json')
}


function setup() {
    let cnv = createCanvas(600, 300)
    cnv.parent('#canvas')
    colorMode(HSB, 360, 100, 100, 100)
    textFont(font, 14)
    imageMode(CENTER)
    rectMode(CENTER)

    debugCorner = new CanvasDebugCorner(5)
    instructions = select('#ins')
    instructions.html(`<pre>
        [cwubrg] → toggle icon highlight; shift+ to untoggle
        numpad 1 → freeze sketch</pre>`)

    cards = getCardData()

    let icons = []
    icons.push(new colorIcon('c', c, color(35,6,75)))
    icons.push(new colorIcon('w', w, color(62,31,95)))
    icons.push(new colorIcon('u', u, color(209,40,89)))
    icons.push(new colorIcon('b', b, color(27,10,67)))
    icons.push(new colorIcon('r', r, color(17,60,86)))
    icons.push(new colorIcon('g', g, color(100,40,71)))

    strip = new ColorSelector(icons)
}


function draw() {
    background(234, 34, 24)

    strip.render()

    /* debugCorner needs to be last so its z-index is highest */
    debugCorner.setText(`frameCount: ${frameCount}`, 3)
    debugCorner.setText(`fps: ${frameRate().toFixed(0)}`, 2)
    debugCorner.setText(`availableColorChs: ${strip.getAvailableColorChs()}`, 1)
    debugCorner.setText(`selected: ${strip.getSelectedColorChars()}`, 0)
    debugCorner.show()
}


function getCardData() {
    let results = []
    let data = scryfall['data']

    /* regex for detecting creatures and common/uncommon rarity */
    const rarity = new RegExp('(common|uncommon|rare|mythic)')

    let count = 0

    for (let key of data) {
        /* filter for rarity */
        if (rarity.test(key['rarity'])) {
            let cardData = {
                'name': key['name'],
                'colors': key['colors'],
                'cmc': key['cmc'],
                'type_line': key['type_line'],
                'oracle_text': key['oracle_text'],
                'collector_number': int(key['collector_number']),
                'art_crop_uri': key['image_uris']['art_crop'], /*626x457 ½ MB*/
                'normal_uri': key['image_uris']['normal'],
                'large_uri': key['image_uris']['large'],
                'png_uri': key['image_uris']['png'] /* 745x1040 */

                /* normal 488x680 64KB, large 672x936 100KB png 745x1040 1MB*/
            }

            results.push(cardData)
            count++
        }
    }
    return results
}


function keyPressed() {
    /* stop sketch */
    if (keyCode === 97) { /* numpad 1 */
        noLoop()
        instructions.html(`<pre>
            sketch stopped</pre>`)
    }

    /** if our key is in the color dictionary, select the corresponding icon */
    const lowerCaseKey = key.toLowerCase()
    if (strip.getAvailableColorChs().includes(lowerCaseKey)) {
        if (lowerCaseKey === key) {
            strip.select(key)
            /* if it's the uppercase version of the key, deselect it */
        } else {
            strip.deSelect(lowerCaseKey)
        }
    }

    if (key === 'z') {
        /* instant / flash cards that satisfy color requirements */
        let tricks = []
        for (let card of cards) {
            if (card['oracle_text'].includes('Flash') ||
                card['type_line'] === 'Instant') {
                tricks.push(card)
            }
        }

        let results = [] /* tricks that satisfy selected colors in UI */
        for (let trick of tricks) {
            // console.log(`${trick.name}→${trick.colors}`)

            /* see if this trick's colors are all selected in the UI. e.g.
             * brokers charm requires w,u,g all to be selected */
            let allColorsSelected = true
            
            /* iterate through each of the trick's colors */
            for (let i in trick['colors']) {
                let c = trick['colors'][i].toLowerCase()
                if (!strip.getSelectedColorChars().includes(c))
                    allColorsSelected = false
            }

            if (allColorsSelected)
                results.push(trick.name)
        }
        console.log(results)
    }
}


/** 🧹 shows debugging info using text() 🧹 */
class CanvasDebugCorner {
    constructor(lines) {
        this.size = lines
        this.debugMsgList = [] /* initialize all elements to empty string */
        for (let i in lines)
            this.debugMsgList[i] = ''
    }

    setText(text, index) {
        if (index >= this.size) {
            this.debugMsgList[0] = `${index} ← index>${this.size} not supported`
        } else this.debugMsgList[index] = text
    }

    show() {
        textFont(font, 14)
        strokeWeight(1)

        const LEFT_MARGIN = 10
        const DEBUG_Y_OFFSET = height - 10 /* floor of debug corner */
        const LINE_SPACING = 2
        const LINE_HEIGHT = textAscent() + textDescent() + LINE_SPACING
        fill(0, 0, 100, 100) /* white */
        strokeWeight(0)

        for (let index in this.debugMsgList) {
            const msg = this.debugMsgList[index]
            text(msg, LEFT_MARGIN, DEBUG_Y_OFFSET - LINE_HEIGHT * index)
        }
    }
}