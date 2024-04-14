export function parsePath(opt, path) {
    if (!path) return;

    const keywords = [opt.rootDirKey, opt.ignoreDirKey];
    const foundKeyword = keywords.find(keyword => path.includes(keyword));

    return foundKeyword ? path.slice(path.indexOf(foundKeyword)) : path;
}

export function pathType (path, type) {
    return path.indexOf(type);
}

export function findReactFiberProperty(element) {
    const propRegex = '__reactFiber';
    for (const prop in element) {
        if (prop.indexOf(propRegex) > -1) {
            return element[prop];
        }
    }
    return null;
}


export function getRelationPath (path, type) {
    const isTypeCorrect = pathType(path, type);
    if (isTypeCorrect > -1) {
       return path.slice(isTypeCorrect);
    }
    return '';
}

function getDebugInfo(el) {
    const fiber = findReactFiberProperty(el);
    return fiber?._debugSource;
}

function getProjectPath(opt, el) {
    let currentEl = el;
    let debugInfo = getDebugInfo(currentEl);
    if (!debugInfo) return {debugInfo: {}, el};
    while (pathType(debugInfo?.fileName, opt.ignoreDirKey) > -1) {
        currentEl = currentEl.parentNode;
        debugInfo = getDebugInfo(currentEl);
    }
    return {debugInfo, el: currentEl};
}


export function getComponentPath(opt, el) {
    let count = 10;
    const result = [];
    let {el: currentEl} = getProjectPath(opt, el);
    for (let step = 0; step <= count; step++) {
        const {fileName} = getProjectPath(opt, currentEl)?.debugInfo || {};
        const parsedFileName = parsePath(opt, fileName);
        if (fileName && !result.includes(parsedFileName)) {
            result.push(parsedFileName);
        }
        if (!currentEl) break;
        currentEl = currentEl.parentNode;
    }
    return result;
}

