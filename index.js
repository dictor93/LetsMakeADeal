const Table = require('cli-table')

const GOAT = false
const CAR = true

const CHOOSED = true
const CLOSE = false


class Door {
  state = CLOSE
  item = undefined
  constructor(item) {
    this.item = item
  }
  select = () => {
    this.state = CHOOSED
  }
}

function randomInteger(min, max) {
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}


const random1of3 = () => randomInteger(1, 3)

function format (doors, selectedDoor, hostChoise, finalyDesigion) {
  const row = []
  doors.forEach((door, index) => {
    row.push(
      `${
        door.item === CAR ? 'CAR' : 'GOAT'
      }${
        index === selectedDoor ? ' GAMER' : ''
      }${
        index === hostChoise ? ' HOST' : ''
      }${
        index === finalyDesigion ? ' CHANGED' : ''
      }`
    )
  })

  return row
}

const generate = () => {
  const doors = new Map()
  const doorWithCarIndex = random1of3()
  for(let i = 0; i < 3; i++) {
    const index = i + 1
    doors.set(index, new Door(index === doorWithCarIndex ? CAR : GOAT ))
  }
  return doors
}

const changeSelection = (doors) => {
  let changed
  doors.forEach((door, index) => {    if(door.state === CLOSE) {
      changed = index
      door.select()
    }
  })

  return changed
}

const initialChoice = (selectedNumber) => {
  const doors = generate()
  const selectedDoor = doors.get(selectedNumber)
  selectedDoor.select()

  return { doors, selectedDoor }
}

const hostTurn = (doors, selectedDoor) => {
  let hostChoise
  if(selectedDoor.item === GOAT) {
    doors.forEach((door, index) => {
      if(door.state === CLOSE && door.item === GOAT) {
        hostChoise = index
      }
    })
  } else {
    const closedGoatsIndex = []
    doors.forEach((door, index) => {
      if(door.state === CLOSE && door.item === GOAT) {
        closedGoatsIndex.push(index)
      }
    })
    hostChoise = closedGoatsIndex[Math.random() < 0.5 ? 0 : 1]
  }
  doors.get(hostChoise).select()
  return hostChoise
}

const newGame = (selectedNumber) => {
  const { doors, selectedDoor } = initialChoice(selectedNumber)
  const hostChoise = hostTurn(doors, selectedDoor)
  const finalyDesigion = changeSelection(doors)
  return { doors, selectedDoor, hostChoise, finalyDesigion }
}

const runManyTimes = (times) => {
  const table = new Table({
    head: ['First', 'Second', 'Thirth'],
    colWidths: [15, 15, 15],
    rows: []
  });

  let wins = 0
  for(let i = 0; i < times; i++) {
    const { doors, selectedDoor, hostChoise, finalyDesigion } = newGame(random1of3())
    doors.get(finalyDesigion).item === CAR && wins++
    table.push(format(doors, selectedDoor, hostChoise, finalyDesigion))
  }

  console.log(table.toString());

  const looses = times - wins

  return new Table({
    head: ['Wins', 'Looses'],
    colWidths: [15, 15],
    rows: [[wins, looses]]
  });
}

const score = runManyTimes(process.argv[2] || 1000)

console.log(score.toString())