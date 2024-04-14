import { createPopperLite as createPopper } from '@popperjs/core';
import { findReactFiberProperty, getComponentPath, getRelationPath } from "./utils.js";
import { OPEN_KEY, defaultOpt } from './option.js';
function createOpenButton(text, style = {}) {
    const buttonStyles = {
        border: 'none',
        background: '#096dd9',
        outline: 'none',
        borderRadius: '4px',
        color: '#fff',
        padding: '5px 10px',
        marginTop: '10px',
        ...style,
    };

    const buttonEl = document.createElement('button');
    Object.assign(buttonEl.style, buttonStyles);
    buttonEl.textContent = text;
    return buttonEl;
}

function generateComponentTemplate(components) {
    const componentItems = components.map((component, index) => `
        <div style="margin-top: 10px; display: flex">
            <div style="display: flex; align-items: center; justify-content: center;height: 20px; width: 20px; background: #1677ff; border-radius: 50%">
                <span 
                    style="border-radius:50%; text-align: center; display: inline-block; background: #fff; height: 8px; width: 8px;">
                </span> 
            </div>
            <p style="margin-left: 10px">${component}</p>
        </div>`
    ).join('');

    return `
        <div style="position: relative">
            <div style="position: absolute; top: 0; left: 10px; width: 8px; border-left: 1px solid #d9d9d9; z-index: -1; bottom: 0"></div>
            ${componentItems}
        </div>`;
}


function showTooltip(opt, debugInfo, element, tooltip) {
    const hide = () => {
        tooltip.style.display = 'none';
    }
    const show = () => {
        tooltip.style.display = 'block';
    }
    if (!debugInfo || window.localStorage.getItem(OPEN_KEY) !== 'true') return hide();

    show();
    const {fileName, lineNumber} = debugInfo;
    const projectPath = getRelationPath(fileName, opt.rootDirKey);
    const nodeModulePath = getRelationPath(fileName, 'node_modules');

    let target = fileName;
    let targetLineNum = lineNumber;
    let template = '';

    if (projectPath) {
        template += `
                <p style="margin-bottom: 10px">
                    <span style="font-weight: bolder">path: ${projectPath}</span>
                </p>`;
    }

    if (nodeModulePath) {
        template += `<p style="margin-bottom: 10px"><span style="font-weight: bolder">currentPath</span>: ${nodeModulePath}</p>`;
    }

    const components = getComponentPath(opt, element);
    template += generateComponentTemplate(components);

    tooltip.innerHTML = template;


    const openWithVscodeBtn = createOpenButton('Open with vscode');
    openWithVscodeBtn.addEventListener('click', () => {
        window.open(`vscode://file/${target}:${targetLineNum}`);
    });

    const openWithWebstorm = createOpenButton('Open with Webstorm', {
        marginLeft: '10px',
        display: 'inline-block',
    });
    openWithWebstorm.addEventListener('click', () => {
        window.open(`webstorm://open?file=${target}&line=${targetLineNum}`);
    });


    tooltip.appendChild(openWithVscodeBtn);
    tooltip.appendChild(openWithWebstorm);

    createPopper(element, tooltip, {placement: 'bottom'});
    tooltip.style.zIndex = '100000';
    tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.borderRadius = '4px';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px 4px';

    return tooltip;
}


const getOpenText = (isOpen) => isOpen ? 'turn off code path' : 'open code path';

function createCloseBtn(tooltip) {
    const buttonEl = document.createElement('button');
    buttonEl.style.position = 'fixed';
    buttonEl.style.bottom = '250px';
    buttonEl.style.right = '10px';
    buttonEl.style.border = 'none';
    buttonEl.style.background = 'rgba(0,0,0, .8)';
    buttonEl.style.outline = 'none';
    buttonEl.style.borderRadius = '4px';
    buttonEl.style.color = '#fff';
    buttonEl.style.padding = '2px 10px';
    buttonEl.style.marginTop = '10px';
    buttonEl.style.fontSize = '16px';
    const isOpen = window.localStorage.getItem(OPEN_KEY);
    buttonEl.innerHTML = getOpenText(isOpen === 'true');
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

/**
 * @param {Partial<import('./option.js')['defaultOpt']>} option
 */
export default function init(option) {
    const opt = {...option, ...defaultOpt};

    function createToolTip() {
        const tooltipEle = document.createElement('div');
        tooltipEle.setAttribute('class', 'component-tooltip');
        document.body.appendChild(tooltipEle);
        return tooltipEle;
    }

    const tooltip = createToolTip();


    function handleHover(event) {
        const targetElement = event.target;
        const reactFiberProperty = findReactFiberProperty(targetElement);
        if (reactFiberProperty) {
            showTooltip(opt, reactFiberProperty._debugSource, targetElement, tooltip);
        }
    }

    document.addEventListener('mouseover', handleHover);
    window.localStorage.setItem(OPEN_KEY, 'true');
    document.body.appendChild(createCloseBtn(tooltip));
}

