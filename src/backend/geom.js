import { envVar } from "./data.js"
import { exact, exists } from "./helper.js"

export const dot = (a, b) => a.map((x, i) => a[i] * b[i]).reduce((m, n) => m + n)
export const minus = (a, b) => [a[0] - b[0], a[1] - b[1]]
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max)
export const times = (fac, a) => [a[0] * fac, a[1] * fac]
export const plus = (a, b) => [a[0] + b[0], a[1] + b[1]]
export const grad = (x1, y1, x2, y2) => (y2 - y1)/(x2 - x1)
// gradient of line ab in radians wrt to a
export const grad2 = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0])
export const midPoint = (p1, p2) => [exact(p1[0] + (p2[0] - p1[0])/2), exact(p1[1] + (p2[1] - p1[1])/2)]
export const within = (a, x, y) => x < y ? (a > x && a < y) : (a > y && a < x)
export const ontop = (a, x, y) => x < y ? (a >= x && a <= y) : (a >= y && a <= x)

/*
Geometry functions
*/

// closest point from coord on line
export function closest(x1, y1, x2, y2, coord) {
    let a = [x1, y1]
    let b = [x2, y2]
    let c = coord
    let ab = minus(b, a)

    let t = dot(minus(c, a), ab) / dot(ab, ab)
    t = clamp(t, 0, 1)

    return plus(a, times(t, ab))
}
 // calculate distance between two coords
 export function distTo(a, b) {
    return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2))
}

// determines if coord lies on the boundaries of a line
export function onLine(line, coord) {
    let x1 = line[0][0]
    let y1 = line[0][1]
    let x2 = line[1][0]
    let y2 = line[1][1]

    let gradient = grad(x1, y1, x2, y2)
    if  (gradient == Infinity || gradient == -Infinity) {
        return equalVal(x1, coord[0]) && ontop(coord[1], y1, y2)
    } else if (gradient == 0) {
        return equalVal(y1, coord[1]) && ontop(coord[0], x1, x2)
    } else {
        return equalVal((coord[0] - x1) * gradient + y1, coord[1]) && ontop(coord[0], x1, x2) && ontop(coord[1], y1, y2)
    }
}

// find the intersection point between line1 and line2
// optionally include lines outside of plane bounds
export function intersect(line1, line2, outsideBounds=false) {
    let gradient1 = grad(line1[0][0], line1[0][1], line1[1][0], line1[1][1])
    let gradient2 = grad(line2[0][0], line2[0][1], line2[1][0], line2[1][1])
    let x, y
    // handle parallel lines
    if (gradient1 == gradient2 || (gradient1 == Infinity && gradient2 == -Infinity) || (gradient1 == -Infinity && gradient2 == Infinity)) {
        return
    // handle vertical line
    } else if (gradient1 == Infinity || gradient1 == -Infinity) {
        x = line1[0][0]
        y = line2[0][1] + gradient2 * (x - line2[0][0])
    } else if (gradient2 == Infinity || gradient2 == -Infinity) {
        x = line2[0][0]
        y = line1[0][1] + gradient1 * (x - line1[0][0])
    } else {
    // handle non-infinite gradients
        let yIntercept1 = line1[0][1] - gradient1 * line1[0][0]
        let yIntercept2 = line2[0][1] - gradient2 * line2[0][0]
        x = exact((yIntercept2 - yIntercept1) / (gradient1 - gradient2))
        y = exact(gradient1 * x + yIntercept1)
    }
    if (outsideBounds || (onLine(line1, [x,y]) && onLine(line2, [x,y]))) {
        return [exact(x), exact(y)]
    }
}

// determine if two values are equal with threshold difference
export function equalVal(x1, x2) {
    if (x1 == Infinity || x2 == Infinity || x1 == -Infinity || x2 == -Infinity) {
        return x1 == x2;
    }
    return Math.abs(x1 - x2) <= 0.0001
}

// determine if two coords are equal with threshold difference
export function equalCoords(coord1, coord2) {
    return equalVal(coord1[0], coord2[0]) && equalVal(coord1[1], coord2[1])
}

// determine if two lines are equal
export function equalLine(l1, l2) {
    return (equalCoords(l1[0], l2[0]) && equalCoords(l1[1], l2[1])) || 
    (equalCoords(l1[0], l2[1]) && equalCoords(l1[1], l2[0]))
}

// find line passing through point a with a defined gradient
// line extends only from gradient direction is defined
export function lineGrad(a, gradient, gradientDir=undefined) {
    let coord1, coord2
    if  (gradient == Infinity || gradient == -Infinity) {
        coord1 = [a[0], 0]
        coord2 = [a[0], envVar.height]
    } else if (gradient == 0) {
        coord1 = [0, a[1]]
        coord2 = [envVar.width, a[1]]
    } else {
        let yIntercept = a[1] - gradient * a[0]
        let xIntercept = - yIntercept / gradient
        let rightIntercept = yIntercept + envVar.width * gradient
        let topIntercept = xIntercept + envVar.height / gradient
        let intercepts = [[0, exact(yIntercept)], [exact(xIntercept), 0], [envVar.width, exact(rightIntercept)], [exact(topIntercept), envVar.height]]
        let coords = []
        for (let i of intercepts) {
            if (!exists(coords,i) && 0 <= i[0] && i[0] <= envVar.width && 0 <= i[1] && i[1] <= envVar.height) {
                coords.push(i)
            }
        }
        coord1 = coords[0]
        coord2 = coords[1]
        if (!coord1 || !coord2) {
            return undefined
        }
    }
    if (gradientDir != undefined) {
        if (gradientDir > Math.PI) {
            gradientDir -= 2 * Math.PI
        }
        if (equalVal(grad2(a, coord1), gradientDir)) {
            return [a, coord1]
        } else {
            return [a, coord2]
        }
    }
    return [coord1, coord2]
}

// return line passing through points a & b
export function acrossPts(a, b) {
    let gradient = grad(a[0], a[1], b[0], b[1])
    return lineGrad(a, gradient)
}

// find perpendicular line between points a & b
export function bisectPts(a, b) {
    let gradient = -1 / grad(a[0], a[1], b[0], b[1])
    let center = midPoint(a, b)
    return lineGrad(center, gradient)
}

//find angle bisector between lines ba and bc passing through point b
export function bisectAngle(a, b, c) {
    let gradient1 = grad2(b, a)
    let gradient2 = grad2(b, c)

    if (gradient1 <  - Math.PI / 2) {
        gradient1 += Math.PI * 2
    }
    if (gradient2 < - Math.PI / 2) {
        gradient2 += Math.PI * 2
    }
    let bisectGrad = (gradient1 + gradient2) / 2
    if (bisectGrad > Math.PI) {
        bisectGrad -= Math.PI * 2
    }

    let resGradient = exact(Math.tan(bisectGrad))
    return lineGrad(b, resGradient, bisectGrad)
}

// find a line passing through point c that splits line ab perpendicularly
export function cutLine(a, b, c) {
    let gradient = -1 / grad(a[0], a[1], b[0], b[1])
    return lineGrad(c, gradient)
}

// find two lines that bisect lines ab and cd that passes through their intersection
export function bisectLines(a, b, c, d) {
    let gradient1 = grad2(a, b)
    let gradient2 = grad2(c ,d) 

    let resGradient1 = exact(Math.tan((gradient1 + gradient2) / 2))
    let resGradient2 = exact(-1 / resGradient1)
    let intersectPt = intersect([a,b],[c,d], true)
    if (intersectPt) {
        return [lineGrad(intersectPt, resGradient1), lineGrad(intersectPt, resGradient2)]
    }
}

// find a line passing through point c that folds point d onto line ab
export function cutPoint(a, b, c, d) {
    let A = Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2)
    let B = 2 * (b[0] - a[0]) * (a[0] - c[0]) + 2 * (b[1] - a[1]) * (a[1] - c[1])
    let C = Math.pow(c[0], 2) + Math.pow(c[1], 2) + Math.pow(a[0], 2) + Math.pow(a[1], 2) - 2 * (c[0] * a[0] + c[1] * a[1]) - Math.pow(distTo(d, c), 2)
    let discriminant = B*B - 4 * A * C
    let gradCD = Math.atan2(d[1]-c[1], d[0]-c[0])
    if (discriminant < 0) {
        return []
    } else if (discriminant == 0) {
        let s1 = -B / (2 * A)
        let x1 = a[0] + s1 * (b[0] - a[0])
        let y1 = a[1] + s1 * (b[1] - a[1])
        let grad1 = Math.tan((Math.atan2(y1 - c[1], x1 - c[0]) + gradCD) / 2)
        return [lineGrad(c, grad1)]
    } else {
        let s1 = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A)
        let x1 = a[0] + s1 * (b[0] - a[0])
        let y1 = a[1] + s1 * (b[1] - a[1])
        let grad1 = Math.tan((Math.atan2(y1 - c[1], x1 - c[0]) + gradCD) / 2)
        let line1 = lineGrad(c, grad1)
        let s2 = (-B - Math.sqrt(B * B - 4 * A * C)) / (2 * A)
        let x2 = a[0] + s2 * (b[0] - a[0])
        let y2 = a[1] + s2 * (b[1] - a[1])
        let grad2 = Math.tan((Math.atan2(y2 - c[1], x2 - c[0]) + gradCD) / 2)
        let line2 = lineGrad(c, grad2)
        let res = [line1, line2]
        return res.filter(l => l != undefined)
    }
}