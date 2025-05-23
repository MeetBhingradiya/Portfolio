const predefinedBackgrounds = [
    // Default gradients
    {
        id: "Defualt-Dark",
        type: "gradient",
        value: "linear-gradient(117deg, #1B242D 41.82%, #361B2B 60.59%), radial-gradient(circle at center, rgb(0, 15, 24), rgb(0,0,0) 70%)",
        name: "Default Dark",
    },
    {
        id: "Defualt-Light",
        type: "gradient",
        value: "linear-gradient(117deg, #e4f1ff 41.82%, #ffdff2 60.59%), radial-gradient(circle at center, rgb(255, 255, 255), rgb(240, 240, 240) 70%)",
        name: "Default Dark",
    },

    // Solid colors
    { id: "solid-1", type: "color", value: "#0a0a0a", name: "Black" },
    { id: "solid-2", type: "color", value: "#242424", name: "Charcoal" },
    { id: "solid-3", type: "color", value: "#ffffff", name: "White" },
    { id: "solid-4", type: "color", value: "#f5f5f5", name: "Snow" },
    { id: "solid-5", type: "color", value: "#e0e0e0", name: "Platinum" },
    { id: "solid-6", type: "color", value: "#c0c0c0", name: "Silver" },
    { id: "solid-7", type: "color", value: "#808080", name: "Gray" },
    { id: "solid-8", type: "color", value: "#696969", name: "Dim Gray" },
    { id: "solid-9", type: "color", value: "#a9a9a9", name: "Dark Gray" },
    { id: "solid-10", type: "color", value: "#ff0000", name: "Red" },
    { id: "solid-11", type: "color", value: "#dc143c", name: "Crimson" },
    { id: "solid-12", type: "color", value: "#b22222", name: "Fire Brick" },
    { id: "solid-13", type: "color", value: "#8b0000", name: "Dark Red" },
    { id: "solid-14", type: "color", value: "#ff4500", name: "Orange Red" },
    { id: "solid-15", type: "color", value: "#ff8c00", name: "Dark Orange" },
    { id: "solid-16", type: "color", value: "#ffa500", name: "Orange" },
    { id: "solid-17", type: "color", value: "#ffff00", name: "Yellow" },
    { id: "solid-18", type: "color", value: "#ffd700", name: "Gold" },
    { id: "solid-19", type: "color", value: "#f0e68c", name: "Khaki" },
    { id: "solid-20", type: "color", value: "#bdb76b", name: "Dark Khaki" },
    { id: "solid-21", type: "color", value: "#008000", name: "Green" },
    { id: "solid-22", type: "color", value: "#006400", name: "Dark Green" },
    { id: "solid-23", type: "color", value: "#228b22", name: "Forest Green" },
    { id: "solid-24", type: "color", value: "#32cd32", name: "Lime Green" },
    { id: "solid-25", type: "color", value: "#00ff00", name: "Lime" },
    { id: "solid-26", type: "color", value: "#7cfc00", name: "Lawn Green" },
    { id: "solid-27", type: "color", value: "#00ffff", name: "Aqua" },
    { id: "solid-28", type: "color", value: "#00ced1", name: "Dark Turquoise" },
    { id: "solid-29", type: "color", value: "#20b2aa", name: "Light Sea Green" },
    { id: "solid-30", type: "color", value: "#008080", name: "Teal" },
    { id: "solid-31", type: "color", value: "#0000ff", name: "Blue" },
    { id: "solid-32", type: "color", value: "#00008b", name: "Dark Blue" },
    { id: "solid-33", type: "color", value: "#000080", name: "Navy" },
    { id: "solid-34", type: "color", value: "#4169e1", name: "Royal Blue" },
    { id: "solid-35", type: "color", value: "#1e90ff", name: "Dodger Blue" },
    { id: "solid-36", type: "color", value: "#87ceeb", name: "Sky Blue" },
    { id: "solid-37", type: "color", value: "#8a2be2", name: "Blue Violet" },
    { id: "solid-38", type: "color", value: "#4b0082", name: "Indigo" },
    { id: "solid-39", type: "color", value: "#800080", name: "Purple" },
    { id: "solid-40", type: "color", value: "#9400d3", name: "Dark Violet" },
    { id: "solid-41", type: "color", value: "#9932cc", name: "Dark Orchid" },
    { id: "solid-42", type: "color", value: "#ba55d3", name: "Medium Orchid" },
    { id: "solid-43", type: "color", value: "#ff00ff", name: "Fuchsia" },
    { id: "solid-44", type: "color", value: "#c71585", name: "Medium Violet Red" },
    { id: "solid-45", type: "color", value: "#ff1493", name: "Deep Pink" },
    { id: "solid-46", type: "color", value: "#ff69b4", name: "Hot Pink" },
    { id: "solid-47", type: "color", value: "#8b4513", name: "Saddle Brown" },
    { id: "solid-48", type: "color", value: "#a0522d", name: "Sienna" },
    { id: "solid-49", type: "color", value: "#cd853f", name: "Peru" },
    { id: "solid-50", type: "color", value: "#d2b48c", name: "Tan" },

    // Gradients for females
    {
        id: "gradient-female-1",
        type: "gradient",
        value: "linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)",
        name: "Sweet Bliss"
    },
    {
        id: "gradient-female-2",
        type: "gradient",
        value: "linear-gradient(135deg, #43CBFF 0%, #9708CC 100%)",
        name: "Purple Haze"
    },
    {
        id: "gradient-female-3",
        type: "gradient",
        value: "linear-gradient(135deg, #5EFCE8 0%, #736EFE 100%)",
        name: "Aqua Splash"
    },
    {
        id: "gradient-female-4",
        type: "gradient",
        value: "linear-gradient(135deg, #FAD0C4 0%, #FFD1FF 100%)",
        name: "Pink Dream"
    },
    {
        id: "gradient-female-5",
        type: "gradient",
        value: "linear-gradient(135deg, #FFB6C1 0%, #FF69B4 100%)",
        name: "Blush"
    },
    {
        id: "gradient-female-6",
        type: "gradient",
        value: "linear-gradient(135deg, #FF7E5F 0%, #FEB47B 100%)",
        name: "Sunset"
    },
    {
        id: "gradient-female-7",
        type: "gradient",
        value: "linear-gradient(135deg, #E0C3FC 0%, #8EC5FC 100%)",
        name: "Lavender Sky"
    },
    {
        id: "gradient-female-8",
        type: "gradient",
        value: "linear-gradient(135deg, #FFDEE9 0%, #B5FFFC 100%)",
        name: "Cotton Candy"
    },
    {
        id: "gradient-female-9",
        type: "gradient",
        value: "linear-gradient(135deg, #FFD1FF 0%, #FAD0C4 100%)",
        name: "Blossom"
    },
    {
        id: "gradient-female-10",
        type: "gradient",
        value: "linear-gradient(135deg, #D4FFEC 0%, #57F2CC 100%)",
        name: "Mint Breeze"
    },
    {
        id: "gradient-female-11",
        type: "gradient",
        value: "linear-gradient(135deg, #FFC3A0 0%, #FFAFBD 100%)",
        name: "Peach Kiss"
    },
    {
        id: "gradient-female-12",
        type: "gradient",
        value: "linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)",
        name: "Orchid Dream"
    },
    {
        id: "gradient-female-13",
        type: "gradient",
        value: "linear-gradient(135deg, #FBDA61 0%, #FF5ACD 100%)",
        name: "Summer Vibes"
    },
    {
        id: "gradient-female-14",
        type: "gradient",
        value: "linear-gradient(135deg, #F9F586 0%, #F093FB 100%)",
        name: "Lemonade"
    },
    {
        id: "gradient-female-15",
        type: "gradient",
        value: "linear-gradient(135deg, #F5F7FA 0%, #C3CFE2 100%)",
        name: "Cloud Dancer"
    },
    {
        id: "gradient-female-16",
        type: "gradient",
        value: "linear-gradient(135deg, #C9D6FF 0%, #E2E2E2 100%)",
        name: "Soft Whisper"
    },
    {
        id: "gradient-female-17",
        type: "gradient",
        value: "linear-gradient(135deg, #E6E9F0 0%, #EEF1F5 100%)",
        name: "Subtle Snow"
    },
    {
        id: "gradient-female-18",
        type: "gradient",
        value: "linear-gradient(135deg, #F6D365 0%, #FDA085 100%)",
        name: "Golden Peach"
    },
    {
        id: "gradient-female-19",
        type: "gradient",
        value: "linear-gradient(135deg, #65C7F7 0%, #0052D4 100%)",
        name: "Ocean Breeze"
    },
    {
        id: "gradient-female-20",
        type: "gradient",
        value: "linear-gradient(135deg, #DFAEFF 0%, #FFBAF6 100%)",
        name: "Lilac Dreams"
    },

    // Gradients for males (cooler, darker gradients)
    {
        id: "gradient-male-1",
        type: "gradient",
        value: "linear-gradient(135deg, #434343 0%, #000000 100%)",
        name: "Midnight City"
    },
    {
        id: "gradient-male-2",
        type: "gradient",
        value: "linear-gradient(135deg, #1A2980 0%, #26D0CE 100%)",
        name: "Deep Blue"
    },
    {
        id: "gradient-male-3",
        type: "gradient",
        value: "linear-gradient(135deg, #3C3B3F 0%, #605C3C 100%)",
        name: "Dark Earth"
    },
    {
        id: "gradient-male-4",
        type: "gradient",
        value: "linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)",
        name: "Midnight Ocean"
    },
    {
        id: "gradient-male-5",
        type: "gradient",
        value: "linear-gradient(135deg, #283048 0%, #859398 100%)",
        name: "Steel Gray"
    },
    {
        id: "gradient-male-6",
        type: "gradient",
        value: "linear-gradient(135deg, #2B5876 0%, #4E4376 100%)",
        name: "Dusk Blue"
    },
    {
        id: "gradient-male-7",
        type: "gradient",
        value: "linear-gradient(135deg, #141E30 0%, #243B55 100%)",
        name: "Royal Blue"
    },
    {
        id: "gradient-male-8",
        type: "gradient",
        value: "linear-gradient(135deg, #4B6CB7 0%, #182848 100%)",
        name: "Evening Sky"
    },
    {
        id: "gradient-male-9",
        type: "gradient",
        value: "linear-gradient(135deg, #000046 0%, #1CB5E0 100%)",
        name: "Ocean Depths"
    },
    {
        id: "gradient-male-10",
        type: "gradient",
        value: "linear-gradient(135deg, #373B44 0%, #4286f4 100%)",
        name: "Tech Blue"
    },
    {
        id: "gradient-male-11",
        type: "gradient",
        value: "linear-gradient(135deg, #232526 0%, #414345 100%)",
        name: "Charcoal"
    },
    {
        id: "gradient-male-12",
        type: "gradient",
        value: "linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%)",
        name: "Ocean Storm"
    },
    {
        id: "gradient-male-13",
        type: "gradient",
        value: "linear-gradient(135deg, #003973 0%, #E5E5BE 100%)",
        name: "Navy Sand"
    },
    {
        id: "gradient-male-14",
        type: "gradient",
        value: "linear-gradient(135deg, #1F1C2C 0%, #928DAB 100%)",
        name: "Dark Knight"
    },
    {
        id: "gradient-male-15",
        type: "gradient",
        value: "linear-gradient(135deg, #304352 0%, #D7D2CC 100%)",
        name: "Slate"
    },
    {
        id: "gradient-male-16",
        type: "gradient",
        value: "linear-gradient(135deg, #3E5151 0%, #DECBA4 100%)",
        name: "Forest Mist"
    },
    {
        id: "gradient-male-17",
        type: "gradient",
        value: "linear-gradient(135deg, #154734 0%, #1A5E54 100%)",
        name: "Emerald Forest"
    },
    {
        id: "gradient-male-18",
        type: "gradient",
        value: "linear-gradient(135deg, #333333 0%, #5A5454 100%)",
        name: "Smoke"
    },
    {
        id: "gradient-male-19",
        type: "gradient",
        value: "linear-gradient(135deg, #0B486B 0%, #F56217 100%)",
        name: "Sunset Ocean"
    },
    {
        id: "gradient-male-20",
        type: "gradient",
        value: "linear-gradient(135deg, #0D0D0D 0%, #434343 100%)",
        name: "Carbon Fiber"
    }
];

export { predefinedBackgrounds };