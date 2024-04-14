import { createPopper } from '@popperjs/core';
import { findReactFiberProperty, getComponentPath, getRelationPath } from "./utils.js";
import { OPEN_KEY, defaultOpt } from './types.js';

function createOpenButton(text) {
    const buttonStyles = {
        border: 'none',
        display: 'block',
        background: '#096dd9',
        outline: 'none',
        borderRadius: '4px',
        color: '#fff',
        padding: '2px 10px',
        marginTop: '10px'
    };

    const buttonEl = document.createElement('button');
    Object.assign(buttonEl.style, buttonStyles);
    buttonEl.textContent = text;
    return buttonEl;
}

function generateComponentTemplate(components) {
    const componentItems = components.map((component, index) => `
        <div style="margin-top: 10px">
            <span style="border-radius:50%; text-align: center; display: inline-block; background: #5b8c00; height: 20px; width: 20px; line-height: 20px">${index + 1}</span>
            ${component}
        </div>`
    ).join('');

    return `
        <div style="position: relative">
            <div style="position: absolute; top: 0; left: 10px; width: 0; border-left: 1px solid #d9d9d9; z-index: -1; bottom: 0"></div>
            ${componentItems}
        </div>`;
}


function showTooltip(opt, debugInfo, element, tooltip) {
    if (!debugInfo || window.localStorage.getItem(OPEN_KEY) !== 'true') return;

    const { fileName, lineNumber } = debugInfo;
    const projectPath = getRelationPath(fileName, opt.rootDirKey);
    const nodeModulePath = getRelationPath(fileName, opt.ignoreDirKey);

    let target = fileName;
    let targetLineNum = lineNumber;
    let template = '';

    if (projectPath) {
        template += `
                <p style="margin-bottom: 10px">
                    <span style="font-weight: bolder">path</span>: ${projectPath}
                </p>`;
    }

    if (nodeModulePath) {
        template += `<p style="margin-bottom: 10px"><span style="font-weight: bolder">currentPath</span>: ${nodeModulePath}</p>`;
    }

    const components = getComponentPath(opt, element);
    template += generateComponentTemplate(components);

    tooltip.innerHTML = template;


    const openWithVscodeBtn = createOpenButton('Open witch vscode');
    openWithVscodeBtn.addEventListener('click', () => {
      window.open(`vscode://file/${target}:${targetLineNum}`);
    });

    const openWithWebstorm= createOpenButton('Open witch Webstorm');
    openWithWebstorm.addEventListener('click', () => {
        window.open(`webstorm://open?file=${target}&line=${targetLineNum}`);
    });


    tooltip.appendChild(openWithVscodeBtn);
    tooltip.appendChild(openWithWebstorm);

    createPopper(element, tooltip, { placement: 'bottom' });
    tooltip.style.zIndex = '100000';
    tooltip.style.background = 'rgba(0, 0, 0, 0.9)';
    tooltip.style.borderRadius = '4px';
    tooltip.style.color = '#fff';
    tooltip.style.padding = '8px 4px';

    return tooltip;
}



const getOpenText = (isOpen) => isOpen ? 'Turn off code path' : 'Open code path';

function createCloseBtn(tooltip) {
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
 * @param {Partial<import('./types.js')['defaultOpt']>} option 
 */
export default function init(option) {
    const opt = { ...option, ...defaultOpt };
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

