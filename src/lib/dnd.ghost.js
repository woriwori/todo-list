import {getElement, isElement} from '@/lib/helper';
import '@/styles/dnd.ghost.scss';

const ERROR_CODE = {
  E01: 'dropzone이 아닙니다.'
};
let originElement = null;
let ghost = null;
let ghostShadow = null;
let ghostWidth, ghostHeight;
let dropzone = null;
let isContain = false;

function getSize(element) {
  return {
    width: element.offsetWidth,
    height: element.offsetHeight
  };
}

function getPosition(element) {
  return {
    top: element.offsetTop,
    left: element.offsetLeft
  };
}

export async function make(selector) {
  originElement = getElement(selector);

  create().then(ready);
}

async function create() {
  ghost = originElement.cloneNode(true);
  ghostShadow = originElement.cloneNode(true);

  ghost.style.position = 'fixed';
  ghost.style.zIndex = 1000;

  const {width, height} = getSize(originElement);
  ghostWidth = width;
  ghostHeight = height;

  ghostShadow.classList.add('dnd-none');
  ghostShadow.classList.add('dnd-shadow');
  originElement.classList.add('dnd-hidden-origin');
}

function ready() {
  ghost.addEventListener('mousedown', () => {
    document.body.append(ghost);
    document.addEventListener('mousemove', setPosition);
    ghost.addEventListener('mouseup', handleMouseUp);
  });
}

export function execute() {
  ghost.dispatchEvent(new Event('mousedown'));
}

function finish(event) {
  if (!isContain) throw Error(ERROR_CODE.E01);

  dropzone = getDropzone(event.clientX, event.clientY);

  const dropEvent = getDropEvent();

  dropzone.dispatchEvent(dropEvent);

  dropzone.appendChild(originElement);

  destroy();
}

function destroy() {
  originElement.classList.remove('dnd-hidden-origin');
  ghost.parentNode.removeChild(ghost);
  ghostShadow.parentNode.removeChild(ghostShadow);

  ghost = null;
  ghostShadow = null;
  originElement = null;
  ghostWidth = null;
  ghostHeight = null;
}

function setPosition(event) {
  const {offsetLeft, offsetTop} = originElement;
  const {pageX, pageY} = event;

  ghost.style.left = `${pageX - offsetLeft}px`;
  ghost.style.top = `${pageY - offsetTop}px`;

  const {top, left} = getPosition(ghost);
  const dropzoneTopLeft = getDropzone(left, top);
  const dropzoneBottomRight = getDropzone(left + ghostWidth, top + ghostHeight);
  isContain = isElement(dropzoneTopLeft) && isElement(dropzoneBottomRight) && dropzoneTopLeft === dropzoneBottomRight;

  if (isContain) {
    dropzoneTopLeft.appendChild(ghostShadow);
    ghostShadow.classList.remove('dnd-none');
  } else {
    // 한번이라도 append 된 적 있어야 parentNode가 존재
    if (isElement(ghostShadow.parentNode)) ghostShadow.parentNode.removeChild(ghostShadow);
    ghostShadow.classList.add('dnd-none');
  }
}

function handleMouseUp(event) {
  document.removeEventListener('mousemove', setPosition);
  ghost.removeEventListener('mouseup', handleMouseUp);
  try {
    finish(event);
  } catch (error) {
    // console.log(error);
    if (error.message === ERROR_CODE.E01) destroy();
  }
}

function getDropzone(x, y) {
  const belowElements = document.elementsFromPoint(x, y);
  const dropzone = belowElements.find((el) => el.getAttribute('dropzone') === 'true');

  return dropzone;
}

function getDropEvent() {
  return new CustomEvent('drop', {bubbles: false, detail: {target: originElement, isContain: isContain}});
}