import { createPopper } from '@popperjs/core';

const tooltipDiv = document.createElement('div');
tooltipDiv.style.position = 'absolute';
tooltipDiv.style.background = 'rgba(255, 255, 255, 0.9)';
tooltipDiv.style.padding = '5px';
tooltipDiv.style.border = '1px solid #ccc';
tooltipDiv.style.borderRadius = '5px';
tooltipDiv.style.zIndex = '9999';
tooltipDiv.style.display = 'none';

const OPEN_KEY = '__isOpen';

function parsePath(path) {
    if (!path) return;
    const srcIndex = path.indexOf('src');
    const nodeModuleInex = path.indexOf('node_modules');
    if (srcIndex > -1) {
        const projectPath = path.slice(srcIndex);
        return projectPath;
    } else {
        const nodeModulePath = path.slice(nodeModuleInex);
        return nodeModulePath;
    }
}

function createToolTip() {
    const tooltip = document.createElement('div');
    tooltip.className = 'component-tooltip';
    document.body.appendChild(tooltip);
    return tooltip;
}

const tooltip = createToolTip();

function createCopyButton(getText) {
    const buttonEl = document.createElement('button');
    buttonEl.style.border = 'none';
    buttonEl.style.background = '#722ed1';
    buttonEl.style.outline = 'none';
    buttonEl.innerHTML = '在vscode打开';
    buttonEl.style.borderRadius = '4px';
    buttonEl.style.color = '#fff';
    buttonEl.style.padding = '2px 10px';
    buttonEl.style.marginTop = '10px';
    buttonEl.addEventListener('click', () => {
        const {target, targetLineNum, targetColumn} = getText();
        window.open(`vscode://file/${target}:${targetLineNum}:${targetColumn}`);
    });
    return buttonEl;
}


function showTooltip(debugInfo, element) {
    console.log('debugInfo', debugInfo);
    if (!debugInfo) return;
    if (window.localStorage.getItem(OPEN_KEY) !== 'true') return;
    const {fileName} = debugInfo;
    let projectPath;
    let nodeModulePath;
    let lineNumber;


    let template = '';
    let target = fileName;
    let targetLineNum = debugInfo.lineNumber;
    let targetColumn = debugInfo.columnNumber;

    const srcIndex = fileName.indexOf('src');
    const nodeModuleInex = fileName.indexOf('node_modules');

    if (srcIndex > -1) {
        projectPath = fileName.slice(srcIndex);
        lineNumber = debugInfo.lineNumber;
        template = `<p style="margin-bottom: 10px">文件路径: ${projectPath} </p>`;
    } else {
        let {fileName: projectPathFull, lineNumber: projectLineNumber} = getProjectPath(element)?.debugInfo || {};
        if (!projectPathFull) return;
        target = projectPathFull;
        const srcIndex = projectPathFull.indexOf('src');
        projectPath = projectPathFull.slice(srcIndex);
        nodeModulePath = fileName.slice(nodeModuleInex);
        lineNumber = debugInfo.lineNumber;
        targetLineNum = lineNumber;
        targetColumn = debugInfo.columnNumber;

        template = `<p style="margin-bottom: 10px">业务文件路径: ${projectPath} </p>
                        <p style="margin-bottom: 10px">当前文件路径: ${nodeModulePath} </p>
                        `;
    }
    const result = getComponentPath(element);
    template += `<div style="position: relative">
                       <div style="position: absolute; top: 0; left: 10px; width: 0; border-left: 1px solid #d9d9d9; z-index: -1; bottom: 0"></div>`
    for (let i = 0; i < result.length; i++) {
        const c = result[i];
        template += `
             <div style="margin-top: 10px">
                 <span style="border-radius:50%; text-align: center; display: inline-block; background: #5b8c00; height: 20px; width: 20px; line-height: 20px">${i + 1}</span>
                 ${c}
             </div>
            `
    }
    template += '</div>'


    tooltip.innerHTML = template;

    const btn = createCopyButton(() => ({
        target,
        targetLineNum,
        targetColumn,
    }));

    tooltip.appendChild(btn);

    createPopper(element, tooltip, {
        placement: 'bottom',
    });
    tooltip.style.zIndex = '100000';
    tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.borderRadius = '4px';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px 4px';
    return tooltip;
}

function handleHover(event) {
    const targetElement = event.target;

    const reactFiberProperty = findReactFiberProperty(targetElement);
    if (reactFiberProperty) {
        showTooltip(reactFiberProperty._debugSource, targetElement);
    }
}


function hideTooltip(element) {
    const tooltip = document.querySelector('.component-tooltip');
    if (tooltip) {
        tooltip.remove();
    }
}

// document.addEventListener('mouseout', hideTooltip);

function findReactFiberProperty(element) {
    const propRegex = '__reactFiber';

    for (const prop in element) {
        if (prop.indexOf(propRegex) > -1) {
            return element[prop];
        }
    }

    return null;
}

function getDebugInfo(el) {
    const fiber = findReactFiberProperty(el);
    return fiber?._debugSource;
}

function getProjectPath(el) {
    let currentEl = el;
    let debugInfo = getDebugInfo(currentEl);
    if (!debugInfo) return {debugInfo: {}, el};
    while (debugInfo?.fileName.indexOf('node_modules') > -1) {
        currentEl = currentEl.parentNode;
        debugInfo = getDebugInfo(currentEl);
    }
    return {debugInfo, el: currentEl};
}

function getComponentPath(el) {
    let count = 10;
    const result = [];
    let {el: currentEl} = getProjectPath(el);
    for (let step = 0; step <= count; step++) {
        const {fileName} = getProjectPath(currentEl)?.debugInfo || {};
        const parsedFileName = parsePath(fileName);
        if (fileName && !result.includes(parsedFileName)) {
            result.push(parsedFileName);
        }
        if (!currentEl) break;
        currentEl = currentEl.parentNode;
    }
    return result;
}

const getOpenText = (isOpen) => isOpen ? '关闭代码提示' : '打开代码提示';

function createCloseBtn() {
    const buttonEl = document.createElement('button');
    buttonEl.style.position = 'fixed';
    buttonEl.style.bottom = '250px';
    buttonEl.style.right = '10px';
    buttonEl.style.border = 'none';
    buttonEl.style.background = 'rgba(69,157,245,.6)';
    buttonEl.style.outline = 'none';
    buttonEl.style.borderRadius = '4px';
    buttonEl.style.color = '#fff';
    buttonEl.style.padding = '2px 10px';
    buttonEl.style.marginTop = '10px';
    const isOpen = window.localStorage.getItem(OPEN_KEY);
    buttonEl.innerHTML = getOpenText(isOpen == 'true');
    buttonEl.addEventListener('click', () => {
        let currentStatus = window.localStorage.getItem(OPEN_KEY);
        if (currentStatus === 'true') {
            currentStatus = false;
            tooltip.style.display = 'none';
        } else {
            currentStatus = true;
            tooltip.style.display = 'block';
        }
        window.localStorage.setItem(OPEN_KEY, currentStatus);
        buttonEl.innerHTML = getOpenText(currentStatus);
    });
    return buttonEl;
}

export default function init() {
    document.addEventListener('mouseover', handleHover);
    window.localStorage.setItem(OPEN_KEY, 'true');
    document.body.appendChild(createCloseBtn());
}

