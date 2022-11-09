# Header 1

## Header 2

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed malesuada quam eros, id ultricies augue sagittis ut. Aliquam id enim at urna viverra scelerisque vitae vitae nulla. Vivamus condimentum sem sit amet ligula aliquet, sit amet porttitor urna molestie. In hac habitasse platea dictumst. Morbi at tellus sagittis, scelerisque sem id, fringilla mauris. Phasellus ligula felis, laoreet eget sodales et, aliquet vel purus. Aliquam ac lacus quis massa aliquam ultrices. Nulla a tellus elementum, convallis velit in, ultrices odio. Vestibulum ac suscipit arcu. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Etiam malesuada nisl nisi, a mollis diam molestie et. Sed ultricies augue eget finibus euismod.

* Bullet lists are easy too
- Another one
+ Another one

Check list

- [x] Task 1
- [x] Task 2
- [x] Task 3
- [ ] Task 4

## Header 2

[Link](#id-goes-here)

This is a paragraph, which is text surrounded by
whitespace. Paragraphs can be on one
line (or many), and can drone on for hours.

Now some inline markup like _italics_,  **bold**,
and `code()`. Note that underscores
in_words_are ignored.

```js
{
  value: ["or with a mime type"]
}
```

> Blockquotes are like quoted text in email replies
>> And, they can be nested

1. A numbered list
2. Which is numbered
3. With periods and a space

And a block


### Horizontal rules

* * * *
****
--------------------------

![picture alt](/images/photo.jpeg "Title is optional")

## Markdown plus tables

| Header | Header | Right  |
| ------ | ------ | -----: |
|  Cell  |  Cell  |   $10  |
|  Cell  |  Cell  |   $20  |

* Outer pipes on tables are optional
* Colon used for alignment (right versus left)

## Markdown plus definition lists

Bottled water
: $ 1.25
: $ 1.55 (Large)

Milk
Pop
: $ 1.75

* Multiple definitions and terms are possible
* Definitions can include multiple paragraphs too

*[ABBR]: Markdown plus abbreviations (produces an <abbr> tag)


```js
var x = "string";
function f() {
  return x;
}
```

<!-- html madness -->
<div class="custom-class" markdown="1">
  <div>
    nested div
  </div>
  <script type='text/x-koka'>
    function( x: int ) { return x*x; }
  </script>
  This is a div _with_ underscores
  and a & <b class="bold">bold</b> element.
  <style>
    body { font: "Consolas" }
  </style>
</div>

```ts
/* Game of Life
 * Implemented in TypeScript
 * To learn more about TypeScript, please visit http://www.typescriptlang.org/
 */

namespace Conway {

  export class Cell {
    public row: number;
    public col: number;
    public live: boolean;

    constructor(row: number, col: number, live: boolean) {
      this.row = row;
      this.col = col;
      this.live = live;
    }
  }

  export class GameOfLife {
    private gridSize: number;
    private canvasSize: number;
    private lineColor: string;
    private liveColor: string;
    private deadColor: string;
    private initialLifeProbability: number;
    private animationRate: number;
    private cellSize: number;
    private context: CanvasRenderingContext2D;
    private world;


    constructor() {
      this.gridSize = 50;
      this.canvasSize = 600;
      this.lineColor = '#cdcdcd';
      this.liveColor = '#666';
      this.deadColor = '#eee';
      this.initialLifeProbability = 0.5;
      this.animationRate = 60;
      this.cellSize = 0;
      this.world = this.createWorld();
      this.circleOfLife();
    }

    public createWorld() {
      return this.travelWorld( (cell : Cell) =>  {
        cell.live = Math.random() < this.initialLifeProbability;
        return cell;
      });
    }

    public circleOfLife() : void {
      this.world = this.travelWorld( (cell: Cell) => {
        cell = this.world[cell.row][cell.col];
        this.draw(cell);
        return this.resolveNextGeneration(cell);
      });
      setTimeout( () => {this.circleOfLife()}, this.animationRate);
    }

    public resolveNextGeneration(cell : Cell) {
      var count = this.countNeighbors(cell);
      var newCell = new Cell(cell.row, cell.col, cell.live);
      if(count < 2 || count > 3) newCell.live = false;
      else if(count == 3) newCell.live = true;
      return newCell;
    }

    public countNeighbors(cell : Cell) {
      var neighbors = 0;
      for(var row = -1; row <=1; row++) {
        for(var col = -1; col <= 1; col++) {
          if(row == 0 && col == 0) continue;
          if(this.isAlive(cell.row + row, cell.col + col)) {
            neighbors++;
          }
        }
      }
      return neighbors;
    }

    public isAlive(row : number, col : number) {
      if(row < 0 || col < 0 || row >= this.gridSize || col >= this.gridSize) return false;
      return this.world[row][col].live;
    }

    public travelWorld(callback) {
      var result = [];
      for(var row = 0; row < this.gridSize; row++) {
        var rowData = [];
        for(var col = 0; col < this.gridSize; col++) {
          rowData.push(callback(new Cell(row, col, false)));
        }
        result.push(rowData);
      }
      return result;
    }

    public draw(cell : Cell) {
      if(this.context == null) this.context = this.createDrawingContext();
      if(this.cellSize == 0) this.cellSize = this.canvasSize/this.gridSize;

      this.context.strokeStyle = this.lineColor;
      this.context.strokeRect(cell.row * this.cellSize, cell.col*this.cellSize, this.cellSize, this.cellSize);
      this.context.fillStyle = cell.live ? this.liveColor : this.deadColor;
      this.context.fillRect(cell.row * this.cellSize, cell.col*this.cellSize, this.cellSize, this.cellSize);
    }

    public createDrawingContext() {
      var canvas = <HTMLCanvasElement> document.getElementById('conway-canvas');
      if(canvas == null) {
          canvas = document.createElement('canvas');
          canvas.id = 'conway-canvas';
          canvas.width = this.canvasSize;
          canvas.height = this.canvasSize;
          document.body.appendChild(canvas);
      }
      return canvas.getContext('2d');
    }
  }
}

var game = new Conway.GameOfLife();

```