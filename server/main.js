import { Server } from "socket.io";

//* Herní mapa, 1 reprezentzuje překážku, 0 volnou cestu. Můžeš si jí libovolně upravit.
const map = [
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [1, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 0],
    [0, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 0],
    [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0],
];

//? Napadá tě způsob dynamického generování mapy? Můžeš si jej libovolně doimplementovat!

const shuffle_map = () => {
    return map.slice();
}

//* Barvy tanků
const colors = ["red", "green", "blue", "yellow"];

//* Souřadnice spawnu jednotlivých tanků
const start_positions = [
    { x: 0, y: 0 },
    { x: 11, y: 0 },
    { x: 0, y: 11 },
    { x: 11, y: 11 },
];

//? Změnil jsi ovládání pohybu? Ujisti se, že jsou u klineta nastaveny stejné klávesy jako zde!
const map_key_value = new Map([
    ["KeyW", { x: 0, y: -1, r: 0 }],
    ["KeyA", { x: -1, y: 0, r: 1 }],
    ["KeyS", { x: 0, y: 1, r: 2  }],
    ["KeyD", { x: 1, y: 0, r: 3 }],
]);

const rooms = new Map();
const map_id_room = new Map();   

class Room {   
    started = false;   
    tanks = new Map();   

    constructor(session_id, tank, max_players, room_name, game_map) {   
        this.admin = session_id;   
        this.max_players = max_players;   
        this.room_name = room_name;   
        this.game_map = game_map;   

        this.tanks.set(session_id, tank);   
        map_id_room.set(session_id, room_name);   
    }   

    join(session_id, tank) {
        this.tanks.set(session_id, tank);
        map_id_room.set(session_id, this.room_name);
    }

    delete(room_name, idUz) {
        rooms.get(msg.room_name).tanks = rooms.get(room_name).tanks.delete(idUz);
    }

    tanks_length() {
        return this.tanks.size;
    }

    //TODO: Implementuj metodu pro doplnění nábojů

}

class Tank {
    constructor(index, player_name, session_id) {
        this.dir = 0;
        this.health = 3;
        this.ammo = 3;
        this.x = start_positions[index].x;
        this.y = start_positions[index].y;
        this.color = colors[index];
        this.player_name = player_name;
        this.index = index;
        this.session_id = session_id;
    }


    validate_move(souradnice) {
        if(map[souradnice[1]] == null){
            console.log("Y není validní pozice!");
            return false;
        }
        if(map[souradnice[1]][souradnice[0]] == null){
            console.log("X není validní pozice!");
            return false;
        }
        if(map[souradnice[1]][souradnice[0]] == 0){
            return true;
        } else{
            return false;
        }
    }

    move(key, shift) {
        const action = map_key_value.get(key);

        if(shift == true){
            this.dir = action.r;
            console.log(this.dir)
            return [{ property: "r", value: this.dir }]
        }

        //TODO: Pokud je stisknuta klávesa "shift", tak tank mění pouze směr

        if (this.validate_move([this.x + action.x, this.y + action.y])) {
            this.x += action.x;
            this.y += action.y;

            //TODO: Automatická změna směru, dle pohybu. Nezapomeň tuto informaci zahrnout v return statementu!

            return [{ property: "x", value: this.x }, { property: "y", value: this.y }];
        }

        return false;
    }

    shoot() {
        //TODO: Ověř dostatek nábojů pro střelbu

        //TODO: Nezapomeň tanku po výstřelu odebrat náboj!

        let first_baricade = {}
        const hits = [];

        let map_cp = rooms.get(map_id_room.get(this.session_id)).game_map;

        //TODO: Změň směr střely podle natočení tanku

        let dir_coef = { x: 1, y: 0 };

        for (let i = 1; i <= map_cp.length; i++) {
            //* Kolize střely se zdí
            if (map_cp[this.y + i * dir_coef.y] === undefined || map_cp[this.y + i * dir_coef.y][this.x + i * dir_coef.x] === undefined) {
                first_baricade = { x: this.x + (i - 1) * dir_coef.x, y: this.y + (i - 1) * dir_coef.y };
                break;
            };

            //TODO: Zachyť kolizi střely s barikádou

            //TODO: Najdi zasáhnuté tanky a zavolej na nich metodu hit()
        }
        return { path: [first_baricade, { x: this.x, y: this.y }], hits: hits };
    }
}

const io = new Server(3000, { cors: { origin: '*' } });

io.on("connection", (socket) => {
    socket.on("create_room", (msg) => {
        if (rooms.has(msg.room_name)) {
            socket.emit("error", { message: "Room with this name already exists" });
            return;
        }

        const admin_tank = new Tank(0, msg.player_name, socket.id);

        rooms.set(msg.room_name, new Room(socket.id, admin_tank, msg.max_players, msg.room_name, shuffle_map()));

        socket.join(msg.room_name);

        socket.emit("room_joined", { player_index: 0, room_name: msg.room_name, max_players: msg.max_players });
    });

    socket.on("log_room0", (msg) => {
        console.log(rooms.get(msg.room_name).tanks.get(socket.id).ammo)
        console.log(rooms);
        rooms.get(msg.room_name).tanks.get(socket.id).ammo = rooms.get(msg.room_name).tanks.get(socket.id).ammo+1
    })

    socket.on("log_room1", (msg) => {
        console.log(rooms.get(msg.room_name));
    })

    socket.on("log_room2", (msg) => {
        console.log(msg.room_name);
        console.log(rooms.get(msg.room_name).tanks.delete(msg.session_id));
    })

    socket.on("tnk_del", (msg) => {
        rooms.get(msg.room_name).tanks = rooms.get(msg.room_name).tanks.delete(socket.id);
    })

    socket.on("join_room", (msg) => {
        const room = rooms.get(msg.room_name);

        if (!room) {
            socket.emit("error", { message: "Room with this name doesn't exist! You can create one." });
            return;
        }

        if (room.started) {
            socket.emit("error", { message: "Room already started!" });
            return;
        }

        if (room.tanks_length() == room.max_players) {
            socket.emit("error", { message: "Room is full!" });
            return;
        }

        const new_tank = new Tank(room.tanks_length(), msg.player_name, socket.id);

        room.join(socket.id, new_tank);

        socket.join(msg.room_name);

        socket.emit("room_joined", { player_index: new_tank.index, room_name: msg.room_name, max_players: room.max_players });

        io.to(msg.room_name).emit("update_players", { player_count: room.tanks_length(), max_players: room.max_players });
    })

    //TODO: Přidej event handler pro doborovolné odpojení hráče z čekajcí místnosti (lobby)
    socket.on("leave_room", (msg) => {
        console.log(msg.room_name);
    });

    socket.on("start_room", (msg) => {
        const room = rooms.get(map_id_room.get(socket.id));

        console.log(msg.room_name);

        if(msg.room_name == null || msg.room_name == ""){
            return;
        }

        if(rooms.get(msg.room_name).admin != socket.id){
            return;
        }

        room.started = true;
        io.to(room.room_name).emit("room_started", { tanks: [...room.tanks.entries()], map: map, room_name: room.room_name });
    });

    socket.on("update_move", (msg) => {
        const room = rooms.get(map_id_room.get(socket.id));

        if (!room) {
            socket.emit("error", { message: "Room isn't active!" });
            return;
        };

        const tank = room.tanks.get(socket.id);

        const update_msg = tank.move(msg.key, msg.shift);

        console.log(update_msg);

        if (update_msg) {
            io.to(room.room_name).emit("move_updated", { id: socket.id, update: update_msg });
        }
    });

    socket.on("update_shoot", () => {
        const room = rooms.get(map_id_room.get(socket.id));

        if (!room) {
            return;
        };

        const tank = room.tanks.get(socket.id);

        const update_msg = tank.shoot();

        if (update_msg) {
            io.to(room.room_name).emit("shoot_updated", update_msg);
            io.to(room.room_name).emit("ammo_updated", { tank_id: tank.id, ammo: tank.ammo });
        }
    });

    socket.on('disconnect', () => {
        const room = rooms.get(map_id_room.get(socket.id));

        if (!room) {
            socket.emit("error", { message: "Room isn't active!" });
            return;
        }

        //TODO: Nezapomeň zavolat metodu kick pro smazání dat o hráči

        io.to(room.room_name).emit("player_left", { player_id: socket.id });

        if (room.tanks_length() === 1) {
            io.to(room.room_name).emit("win");
        }
    });
});