const Table = require("cli-table");
const cliSelect = require("cli-select");
const chalk = require("chalk");

const GOAT = false;
const CAR = true;

const CHOOSED = true;
const CLOSE = false;

class Door {
  state = CLOSE;
  item = undefined;
  constructor(item) {
    this.item = item;
  }
  select = () => {
    this.state = CHOOSED;
  };
}

function randomInteger(min, max) {
  let rand = min - 0.5 + Math.random() * (max - min + 1);
  return Math.round(rand);
}

const random1of3 = () => randomInteger(1, 3);

function format({
  doors,
  userChoise,
  hostChoise,
  finalyDesigion,
  intermediary,
}) {
  const row = [];
  doors.forEach((door, index) => {
    if (intermediary) {
      row.push(
        index === userChoise
          ? "FIRST CHOISE"
          : index === hostChoise
          ? (door.item === CAR ? "CAR" : "GOAT") + " HOST"
          : ""
      );
    } else {
      const rowData =  `${door.item === CAR ? "CAR" : "GOAT"}${
        index === userChoise ? " FIRST CHOISE" : ""
      }${index === hostChoise ? " HOST" : ""}${
        index === finalyDesigion ? " FINAL CHOISE" : ""
      }`
      row.push(
        index === finalyDesigion ? (door.item === CAR ? chalk.bold.green(rowData) : chalk.bold.red(rowData) ) : rowData
      );
    }
  });

  return row;
}

const generate = () => {
  const doors = new Map();
  const doorWithCarIndex = random1of3();
  for (let i = 0; i < 3; i++) {
    const index = i + 1;
    doors.set(index, new Door(index === doorWithCarIndex ? CAR : GOAT));
  }
  return doors;
};

const changeSelection = (doors) => {
  let changed;
  doors.forEach((door, index) => {
    if (door.state === CLOSE) {
      changed = index;
      door.select();
    }
  });

  return changed;
};

const initialChoice = (selectedNumber) => {
  const doors = generate();
  const selectedDoor = doors.get(selectedNumber);
  selectedDoor.select();

  return { doors, selectedDoor };
};

const hostTurn = (doors, selectedDoor) => {
  let hostChoise;
  if (selectedDoor.item === GOAT) {
    doors.forEach((door, index) => {
      if (door.state === CLOSE && door.item === GOAT) {
        hostChoise = index;
      }
    });
  } else {
    const closedGoatsIndex = [];
    doors.forEach((door, index) => {
      if (door.state === CLOSE && door.item === GOAT) {
        closedGoatsIndex.push(index);
      }
    });
    hostChoise = closedGoatsIndex[Math.random() < 0.5 ? 0 : 1];
  }
  doors.get(hostChoise).select();
  return hostChoise;
};

const newGame = (selectedNumber) => {
  const { doors, selectedDoor } = initialChoice(selectedNumber);
  const hostChoise = hostTurn(doors, selectedDoor);
  const finalyDesigion = changeSelection(doors);
  return { doors, selectedNumber, hostChoise, finalyDesigion };
};

const runManyTimes = (times) => {
  const table = new Table({
    head: ["First", "Second", "Thirth"],
    colWidths: [20, 20, 20],
    rows: [],
  });

  let wins = 0;
  for (let i = 0; i < times; i++) {
    const { doors, selectedDoor, hostChoise, finalyDesigion } = newGame(
      random1of3()
    );
    doors.get(finalyDesigion).item === CAR && wins++;
    table.push(format({ doors, selectedDoor, hostChoise, finalyDesigion }));
  }

  console.log(table.toString());

  const looses = times - wins;

  return new Table({
    head: ["Wins", "Looses"],
    colWidths: [15, 15],
    rows: [[wins, looses]],
  });
};

const createDoorsTable = () =>
  new Table({
    head: ["First", "Second", "Thirth"],
    colWidths: [20, 20, 20],
    rows: [],
  });

const choosePhase = async () => {
  const { id: userSelected } = await cliSelect({
    values: { 1: "Door 1", 2: "Door 2", 3: "Door 3" },
    defaultValue: 0,
    selected: "",
    unselected: "",
    outputStream: process.stdout,
    inputStream: process.stdin,
    valueRenderer: (value, selected) => {
      if (selected) {
        return chalk.underline.bold.green(`◉ ${value}`);
      }
      return `◯ ${value}`;
    },
  });

  if (
    Number.isNaN(parseInt(userSelected)) ||
    userSelected < 1 ||
    userSelected > 3
  ) {
    console.error("Only 1/2/3 options alloved");
    return choosePhase();
  }

  return parseInt(userSelected);
};

const changeSelectionPhase = async () => {
  const { id } = await cliSelect({
    values: { yes: "YES", no: "NO" },
    selected: "",
    unselected: "",
    outputStream: process.stdout,
    inputStream: process.stdin,
    valueRenderer: (value, selected) => {
      if (selected) {
        return chalk.underline.bold.green(`◉ ${value}`);
      }
      return `◯ ${value}`;
    },
  });

  return id === "yes";
};

const runManually = () => {
  const table = createDoorsTable();
  console.log("Please choose door you want to open (type: 1, 2, or 3 )");
  return new Promise(async (rs) => {
    let win;

    const userChoise = await choosePhase();
    const { doors, selectedDoor } = initialChoice(userChoise);
    hostChoise = hostTurn(doors, selectedDoor);
    console.log(
      `Great! Host decided to open Door ${hostChoise} and there is GOAT. Do you want to change you choise? yes/no`
    );
    const _t = createDoorsTable();
    _t.push(format({ doors, userChoise, hostChoise, intermediary: 1 }));
    console.log(_t.toString());

    const isContinue = await changeSelectionPhase();

    if (isContinue) {
      const finalyDesigion = changeSelection(doors);
      table.push(format({ doors, userChoise, hostChoise, finalyDesigion }));
      win = doors.get(finalyDesigion).item === CAR;
    } else {
      table.push(format({ doors, userChoise, hostChoise }));
      win = doors.get(userChoise).item === CAR;
    }

    console.log(table.toString());

    return rs(
      new Table({
        head: ["Wins", "Looses"],
        colWidths: [15, 15],
        rows: [[win ? 1 : 0, win ? 0 : 1]],
      })
    );
  });
};

const start = async () => {
  const score =
    process.argv[2] === "manually"
      ? await runManually()
      : runManyTimes(process.argv[2] || 1000);

  console.log(score.toString());
  process.exit();
};

start();
