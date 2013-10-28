/**
 *TODO: add more options outside class
 *@param HTMLElement container Контейнер для прогрес-бару
 *@date 12 October 2013
 *@author Nychka Yaroslav nychka08@yandex.ua
 */
function ProgressBar(container) {
    if(!container instanceof HTMLElement)throw new Error("container is not ready!");
    this.container = container;
    this.type = "h";//horizontal
};
ProgressBar.prototype.setType = function(type){
    this.type = type;
    this.redefineProgressPosition();
};
ProgressBar.prototype.getType = function(){
    return this.type;
};
ProgressBar.prototype.getContainerWidth = function(){
    return this.cWidth;
};
ProgressBar.prototype.getContainerHeight = function(){
    return this.cHeight;
};
ProgressBar.prototype.getProgressWidth = function(){
    return this.pWidth;
};
ProgressBar.prototype.getProgressHeight = function(){
    return this.pHeight;
};
ProgressBar.prototype.setProgressWidth = function(value){
    this.pWidth = Math.ceil(value);
    this.pHeight = this.cHeight;
    console.log("pwidth: "+ value);
    console.log("cHeight: " + this.cHeight);
};
ProgressBar.prototype.setProgressHeight = function(value){
    this.pHeight = Math.ceil(value);
    this.pWidth = this.cWidth;
};
ProgressBar.prototype.changePosition = function(){
    this.progressContainer.style.height = this.pHeight + "px";
    this.progressContainer.style.width = this.pWidth + "px";
};
ProgressBar.prototype.setProgressValue = function(value){
    switch (this.type) {
        case 'h' : this.setProgressWidth(value); break;
        case 'v' : this.setProgressHeight(value); break;
        default : throw new Error("type is undefined");
    }
    this.changePosition();
};
/**
 *Вираховує значення елемента без бордерів
 */
ProgressBar.prototype.getInnerValue = function(element, value){
    var elementStyle = window.getComputedStyle(element, null);
    var borderWidth = parseInt(elementStyle.borderLeftWidth);
    if (isNaN(borderWidth)) borderWidth = 0;
    var outer = null;
    switch(value){
        case 0: outer = element.offsetWidth; break;
        case 1 : outer = element.offsetHeight; break;
        default: throw new Error("value is not supported");
    }
    return outer - (borderWidth * 2);
};
/**
 *Ширина або висота контейнера в залежності від типу прогрес-бару
 */
ProgressBar.prototype.getContainerValue = function(){
    switch (this.type) {
        case 'h' : return this.getContainerWidth();
        case 'v' : return this.getContainerHeight();
        default : throw new Error("type is undefined");
    }
};
/**
 *Ширина або висота прогрес-контейнера в залежності від типу прогрес-бару
 */
ProgressBar.prototype.getProgressValue = function(){
    switch (this.type) {
        case 'h' : return this.getProgressWidth();
        case 'v' : return this.getProgressHeight();
        default : throw new Error("type is undefined");
    }
};
//клас прогрес-контейнера
ProgressBar.prototype.progressClass = "progressContainer";
/**
 *Початок програми
 */
ProgressBar.prototype.init = function(){
    this.container.style.position = "relative";
    this.container.style.overflow = "hidden";
    (this.cWidth <= this.cHeight) ? this.type = "v" : this.type = "h";
    this.createProgressContainer();
};
/**
 * Визначити параметри контейнера
 */
ProgressBar.prototype.defineContainerParameters = function(){
    this.cWidth = this.getInnerValue(this.container, 0);
    this.cHeight = this.getInnerValue(this.container, 1);
    console.log("width: " + this.cWidth);
    console.log("height: " + this.cHeight);
};
/**
 * 
 *Перевіряємо чи прогрес-контейнер уже існує, щоб не створювати зайві
 */
ProgressBar.prototype.checkProgressContainer = function(){
   
};
/*
*добавляє стильові параметри для прогрес-контейнера
*/
ProgressBar.prototype.redefineProgressPosition = function(){
    if (this.type === "v") {
        this.progressContainer.style.bottom = "0px";
        this.progressContainer.style.top = "";
    }else if (this.type === "h") {
        this.progressContainer.style.top = "0px";
        this.progressContainer.style.bottom = "";
    }
};
/**
 *створити контейнер прогресу
 */
ProgressBar.prototype.createProgressContainer = function(){
    var div = document.createElement("div");
    div.className = this.progressClass;
    div.style.position = "absolute";
    div.style.left = "0px";
    this.container.appendChild(div);
    this.progressContainer = div;
    this.redefineProgressPosition();
};
ProgressBar.prototype.getProgressContainer = function(){
    return this.progressContainer;
};
/**
 *Встановити значення прогресу
 *@param {String | Int} value percentage
 */
ProgressBar.prototype.setValue = function(value){
    value = parseInt(value);
    //var test = this.getContainerValue();
    if(!isNaN(value) && !(value >= 0 && value <= 100))throw new Error("value must be percent in range beetween 1-100 %");
    var result = this.getContainerValue() / 100 * value;
    this.setProgressValue(result);
};
ProgressBar.prototype.destroy = function(){
    this.container.removeChild(this.progressContainer);
};