// checks if value exists in object
export function exists(obj, val) {
    return Object.values(obj).filter(v => JSON.stringify(v) == JSON.stringify(val)).length != 0
}

export function inArray(arr, obj) {
    return arr.filter(v => JSON.stringify(v) == JSON.stringify(obj)).length != 0
}

export function getKey(obj, val) {
    return Object.keys(obj).find(key => JSON.stringify(obj[key]) === JSON.stringify(val));
}

// Gets input string with length units (px, rem .etc) and returns a float
export function parseLength(str) {
    let parsedStr = str.replace(/\D\-/g, "")
    return parseFloat(parsedStr)
}


// Mitigate floating point errors
export function exact(number) {
    if (number > 0 && Math.log(number) > 30) {
        return Infinity
    } else if (number < 0 && Math.log(number) > 30) {
        return -Infinity
    }
    return parseFloat(parseFloat(number).toPrecision(12))
    // return Math.round(number * Math.pow(10, 12)) / Math.pow(10, 12)
}

