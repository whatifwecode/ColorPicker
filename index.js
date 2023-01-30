const buildPalette = (colorsList) => {
    const paletteContainer = document.getElementById("palette");
    const complementaryContainer = document.getElementById("complementary");
    paletteContainer.innerHTML = "";
    complementaryContainer.innerHTML = "";

    const orderedByColor = orderByLuminance(colorsList);
    const hslColors = convertRGBtoHSL(orderedByColor);
    console.log(hslColors);

    for (let i = 0; i < orderedByColor.length; i++) {
        const hexColor = rgbToHex(orderedByColor[i]);
        console.log(hexColor);

        const hexColorComplementary = hslToHex(hslColors[i]);

        if (i > 0) {
            const difference = calculateColorDifference(
                orderedByColor[i],
                orderedByColor[i - 1]
            );

            if (difference < 120) {
                continue;
            }
        }


        const colorElement = document.createElement("div");
        colorElement.style.backgroundColor = hexColor;
        colorElement.appendChild(document.createTextNode(hexColor));
        paletteContainer.appendChild(colorElement);

        if (hslColors[i].h) {
            const complementaryElement = document.createElement("div");
            complementaryElement.style.backgroundColor = `hsl(${hslColors[i].h},${hslColors[i].s}%,${hslColors[i].l}%)`;

            complementaryElement.appendChild(
                document.createTextNode(hexColorComplementary)
            );
            complementaryContainer.appendChild(complementaryElement);
        }
    }
};


const rgbToHex = (pixel) => {
    const componentToHex = (c) => {
        const hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    };

    return (
        "#" +
        componentToHex(pixel.r) +
        componentToHex(pixel.g) +
        componentToHex(pixel.b)
    ).toUpperCase();
};


const hslToHex = (hslColor) => {
    const hslColorCopy = { ...hslColor };
    hslColorCopy.l /= 100;
    const a =
        (hslColorCopy.s * Math.min(hslColorCopy.l, 1 - hslColorCopy.l)) / 100;
    const f = (n) => {
        const k = (n + hslColorCopy.h / 30) % 12;
        const color = hslColorCopy.l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color)
            .toString(16)
            .padStart(2, "0");
    };
    return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
};


const convertRGBtoHSL = (rgbValues) => {
    return rgbValues.map((pixel) => {
        let hue,
            saturation,
            luminance = 0;

        let redOpposite = pixel.r / 255;
        let greenOpposite = pixel.g / 255;
        let blueOpposite = pixel.b / 255;

        const Cmax = Math.max(redOpposite, greenOpposite, blueOpposite);
        const Cmin = Math.min(redOpposite, greenOpposite, blueOpposite);

        const difference = Cmax - Cmin;

        luminance = (Cmax + Cmin) / 2.0;

        if (luminance <= 0.5) {
            saturation = difference / (Cmax + Cmin);
        } else if (luminance >= 0.5) {
            saturation = difference / (2.0 - Cmax - Cmin);
        }

        const maxColorValue = Math.max(pixel.r, pixel.g, pixel.b);

        if (maxColorValue === pixel.r) {
            hue = (greenOpposite - blueOpposite) / difference;
        } else if (maxColorValue === pixel.g) {
            hue = 2.0 + (blueOpposite - redOpposite) / difference;
        } else {
            hue = 4.0 + (greenOpposite - blueOpposite) / difference;
        }

        hue = hue * 60;
        if (hue < 0) {
            hue = hue + 360;
        }

        if (difference === 0) {
            return false;
        }

        return {
            h: Math.round(hue) + 180, // plus 180 degrees because that is the complementary color
            s: parseFloat(saturation * 100).toFixed(2),
            l: parseFloat(luminance * 100).toFixed(2),
        };
    });
};


const orderByLuminance = (rgbValues) => {
    const calculateLuminance = (p) => {
        return 0.2126 * p.r + 0.7152 * p.g + 0.0722 * p.b;
    };

    return rgbValues.sort((p1, p2) => {
        return calculateLuminance(p2) - calculateLuminance(p1);
    });
};

const buildRgb = (imageData) => {
    const rgbValues = [];

    // loopin in 4 cause of R, G, B, A;
    for (let i = 0; i < imageData.length; i += 4) {
        const rgb = {
            r: imageData[i],
            g: imageData[i + 1],
            b: imageData[i + 2],
        };

        rgbValues.push(rgb);
    }

    return rgbValues;
};

const calculateColorDifference = (color1, color2) => {
    const rDifference = Math.pow(color2.r - color1.r, 2);
    const gDifference = Math.pow(color2.g - color1.g, 2);
    const bDifference = Math.pow(color2.b - color1.b, 2);

    return rDifference + gDifference + bDifference;
};


const findBiggestColorRange = (rgbValues) => {

    let rMin = Number.MAX_VALUE;
    let gMin = Number.MAX_VALUE;
    let bMin = Number.MAX_VALUE;

    let rMax = Number.MIN_VALUE;
    let gMax = Number.MIN_VALUE;
    let bMax = Number.MIN_VALUE;

    rgbValues.forEach((pixel) => {
        rMin = Math.min(rMin, pixel.r);
        gMin = Math.min(gMin, pixel.g);
        bMin = Math.min(bMin, pixel.b);

        rMax = Math.max(rMax, pixel.r);
        gMax = Math.max(gMax, pixel.g);
        bMax = Math.max(bMax, pixel.b);
    });

    const rRange = rMax - rMin;
    const gRange = gMax - gMin;
    const bRange = bMax - bMin;


    const biggestRange = Math.max(rRange, gRange, bRange);
    if (biggestRange === rRange) {
        return "r";
    } else if (biggestRange === gRange) {
        return "g";
    } else {
        return "b";
    }
};

// MEDIAN CUT & QUANTIZATION

const quantization = (rgbValues, depth) => {
    const MAX_DEPTH = 4;

    if (depth === MAX_DEPTH || rgbValues.length === 0) {
        const color = rgbValues.reduce(
            (prev, curr) => {
                prev.r += curr.r;
                prev.g += curr.g;
                prev.b += curr.b;

                return prev;
            },
            {
                r: 0,
                g: 0,
                b: 0,
            }
        );

        color.r = Math.round(color.r / rgbValues.length);
        color.g = Math.round(color.g / rgbValues.length);
        color.b = Math.round(color.b / rgbValues.length);

        return [color];
    }


    const componentToSortBy = findBiggestColorRange(rgbValues);
    rgbValues.sort((p1, p2) => {
        return p1[componentToSortBy] - p2[componentToSortBy];
    });

    const mid = rgbValues.length / 2;
    return [
        ...quantization(rgbValues.slice(0, mid), depth + 1),
        ...quantization(rgbValues.slice(mid + 1), depth + 1),
    ];
};

const analyze = () => {
    const imgFile = document.getElementById("imgfile");
    const image = new Image();
    const file = imgFile.files[0];
    const fileReader = new FileReader();


    fileReader.onload = () => {
        image.onload = () => {

            const canvas = document.getElementById("canvas");
            canvas.width = image.width;
            canvas.height = image.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(image, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);


            const rgbArray = buildRgb(imageData.data);


            const quantColors = quantization(rgbArray, 0);

            console.log(rgbArray);
            console.log(quantColors);
            console.log(imageData);

            buildPalette(quantColors);
        };
        image.src = fileReader.result;
    };
    fileReader.readAsDataURL(file);
};

analyze();
