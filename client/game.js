const socket = new io("ws://localhost:3000");

socket.on("error", (err) => {
    alert(`Chyba: ${err.message}`);
});

const screens = ["home", "lobby", "game"];

const set_screen = (visible_screen) => {
    screens
        .filter((hidden_screen) => hidden_screen != visible_screen)
        .forEach((hidden_screen) => {
            document.getElementById(hidden_screen).classList.add("hidden");
        });
    document.getElementById(visible_screen).classList.remove("hidden");
};

const scene = document.getElementById("game_view").getContext("2d");

//* Textury
const bg = new Image();
bg.src = "assets/grass.png";

const tank_texture = new Image();
tank_texture.src = "assets/tank.png";

const baricade_texture = new Image(50, 50);
baricade_texture.src = "assets/baricade.png";

const shot_texture = new Image(50, 50);
shot_texture.src = "assets/shot.png";
//*

const tank_rotace = [0, 270, 180, 90]

let game;
class Game {
    tank_directions = new Map([
        [0, 0],
        [1, -Math.PI / 2],
        [2, Math.PI],
        [3, Math.PI / 2],
    ]);

    constructor(room_name, tanks, map) {
        this.room_name = room_name;
        this.tanks = tanks;
        this.map = map;
        this.shots_queue = [];
        this.r = 0;
    }

    update_scene() {
        this.draw_bg();
        this.draw_map();

        this.tanks.forEach((tank) => {
            this.draw_tank(tank);
        });

        this.shots_queue.forEach((shot) => {
            this.draw_shot(shot);
        });
    }

    draw_bg() {
        scene.drawImage(bg, 0, 0, 600, 600);
    }

    draw_map() {
        this.map.forEach((row, i) => {
            row.forEach((baricade, j) => {
                if (baricade) {
                    scene.drawImage(baricade_texture, j * 50, i * 50, 50, 50);
                }
            });
        });

    }

    //TODO: Vytvoř metodu pro rotaci tanku

    draw_tank(tank) {
        console.log("///")
        scene.translate((45/2), (45/2))
        scene.rotate((tank_rotace[tank.r] * Math.PI) / 180)
        scene.translate((45/2)*-1,(45/2)*-1)
        console.log(scene)
        console.log("///")
        scene.drawImage(
            tank_texture,
            tank.x * 50 + 2.5,
            tank.y * 50 + 2.5,
            45,
            45
        );

        scene.beginPath();
        scene.fillStyle = tank.color;
        scene.arc(tank.x * 50 + 25, tank.y * 50 + 25, 5, 0, 2 * Math.PI);
        scene.fill();
        
        scene.translate((45/2), (45/2))
        scene.rotate((tank_rotace[tank.r] * Math.PI) / (180*-1))
        scene.translate((45/2)*-1,(45/2)*-1)
        console.log(tank.x * 50);
    }

    draw_shot(shot) {
        console.log(shot)
        scene.fillStyle = "orange";

        let start_point = shot.path[0];
        let end_point = shot.path[1];

        if (start_point.x > end_point.x) {
            [start_point.x, end_point.x] = [end_point.x, start_point.x];
        }

        if (start_point.y > end_point.y) {
            [start_point.y, end_point.y] = [end_point.y, start_point.y];
        }

        scene.fillRect(
            start_point.x * 50 + 22.5,
            start_point.y * 50 + 22.5,
            (end_point.x - start_point.x) * 50 + 5,
            (end_point.y - start_point.y) * 50 + 5
        );

        //TODO: Vykresli texturu výbuchu na všech zasažených tancích
    }
}

let room_name = '';

const create_room = () => {
    room_name = document.getElementById("room_name").value;
    const max_players = document.getElementById("max_players").value;
    const player_name = document.getElementById("player_name").value;

    if(room_name.length > 10 && player_name.length >10){
        alert("Moc dlouhý název místnosti a moc dlouhé uživatlské jméno!\nLimit obou je 10 znaků!");
        document.getElementById("room_name").value = null;
        document.getElementById("player_name").value = null;
        return;
    }

    if(room_name.length > 10){
        alert("Moc dlouhý název místnosti! Limit je 10 znaků!");
        document.getElementById("room_name").value = null;
        return;
    }

    if(player_name.length > 10){
        alert("Moc dlouhé uživatelské jméno! Limit je 10 znaků!");
        document.getElementById("player_name").value = null;
        return;
    }

    if (!room_name || !max_players || !player_name) {
        alert("Vyplňte všechna pole!");
        return;
    }

    socket.emit("create_room", {
        room_name: room_name,
        max_players: max_players,
        player_name: player_name,
    });
};

const leave_room = () => {
    socket.emit("leave_room", {
        room_name: room_name,
    });
    set_screen("home");
}

function log_room(verze) {
    console.log("log_room" + verze);
    socket.emit("log_room" + verze, {
        room_name: room_name,
    });
}

function tnkDel(){
    socket.emit("tnk_del", {
        room_name: room_name,
    })
    set_screen("home");
}

const join_room = () => {
    const room_name = document.getElementById("room_name").value;
    const player_name = document.getElementById("player_name").value;
    if(player_name.length > 10){
        alert("Moc dlouhé uživatelské jméno! Limit je 10 znaků!");
        document.getElementById("player_name").value = null;
        return;
    }

    if (!room_name || !player_name) {
        alert("Vyplňte jméno místnosti a jméno hráče!");
        return;
    }

    socket.emit("join_room", {
        room_name: room_name,
        player_name: player_name,
    });
};

socket.on("room_joined", (msg) => {
    set_screen("lobby");

    document.getElementById("room_view").innerText = `
  Místnost: ${msg.room_name}
  `;

    document.getElementById("players_view").innerText = `
  Hráči: ${msg.player_index + 1} / ${msg.max_players}
  `;
});

socket.on("update_players", (msg) => {
    document.getElementById(
        "players_view"
    ).innerText = `Hráči: ${msg.player_count} / ${msg.max_players}`;
});

const start_room = () => {
    console.log(room_name);
    socket.emit("start_room", {
        room_name: room_name,
    });
};

const set_indicator = (index, value, type) => {
    const indicator = document.querySelector(`#indicator_${index} .${type}`);
    indicator.innerHTML = "";
    for (let i = 0; i < value; i++) {
        indicator.innerHTML += `<img src="assets/${type}.png" class="w-8 h-8" />`;
    }
};

socket.on("room_started", (msg) => {
    set_screen("game");

    game = new Game(msg.room_name, new Map(msg.tanks), msg.map);

    game.update_scene();

    game.tanks.forEach((tank) => {
        document
            .querySelector(`#indicator_${tank.index}`)
            .classList.remove("hidden");
        document.querySelector(`#indicator_${tank.index} span`).innerText =
            tank.player_name;

        set_indicator(tank.index, 3, "ammo");
        set_indicator(tank.index, 3, "health");
    });
});

//TODO: Při smrti nebo odpojení hráče, skrýj jeho indikátory a smaž ho ze seznamu hráčů

//* Pohyb tanků
socket.on("move_updated", (msg) => {
    //console.log(msg.update.property);
    //console.log(msg.update.property.get("r").value)
    console.log(msg.update);
    console.log('\n \n');
    console.log(game.tanks.get(msg.id))
    const tank = game.tanks.get(msg.id);
    //console.log(tank + '\n');

    msg.update.forEach((update) => {
        tank[update.property] = update.value;
        console.log(update.value)
        console.log(update.property)
    });

    console.log(tank.dir);
    console.log("");

    game.update_scene();
});

socket.on("shoot_updated", (msg) => {
    game.shots_queue.push(msg);

    setTimeout(() => {
        game.shots_queue.shift();
        game.update_scene();
    }, 200);

    msg.hits.forEach((hit) => {
        if (game.tanks.has(hit.id)) {
            const tank = game.tanks.get(hit.id);
            tank.lives = hit.lives;
            set_indicator(tank.index, hit.lives, "health");
        }
    });

    game.update_scene();
});

//TODO: Implementuj event handler pro event změny stavu nábojů

//TODO: Vytvoř funkci, která vyresetuje stav hry

//TODO: Oznam uživateli prohru, na eventu "lost"

//TODO: Oznam uživateli výhru, na eventu "win"

//* odesílání dat o pohybu

/*
? Chceš se radši pohybovat pomocí wsad? Stačí upravit následující pole!
! Musíš používat stejnou sadu kláves u klienta i na serveru!
*/
const move_keys = ["KeyW", "KeyA", "KeyS", "KeyD"];

document.onkeydown = (e) => {
    if (move_keys.includes(e.code)) {
        e.preventDefault();
        socket.emit("update_move", { key: e.code, shift: e.shiftKey });
        return;
    }

    //? Líbí se ti střelba při klávese "space"? Pokud ne, můžeš ji libovolně měnit!
    if (e.code == "Space") {
        e.preventDefault();
        socket.emit("update_shoot");
    }
};