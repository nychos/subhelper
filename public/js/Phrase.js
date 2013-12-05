/*
 * Phrase API
 * 
 * Фраза може знаходитись в 3-ьох станах:
 *     1. в процесі
 *     2. в очікуванні
 *     3. завершена
 * 
 * */
function Phrase(){
    this.statuses = ['process', 'waiting', 'done'];
    this.ready = false;
    this.status = 0;
    this.progressBar = null;
};
Phrase.prototype.init = function(){
    this.defineCountOfWords();//this.total
    this.defineTranslatedWords();//this.translated
    this.defineStatus();//this.status
};
Phrase.prototype.getPhrase = function(){
    return this.phrase;
};
Phrase.prototype.getCountOfWords = function(){
        return this.total;
};
Phrase.prototype.getCountOfTranslatedWords = function(){
        return this.translated;
};
Phrase.prototype.getPriority = function(){
    return this.priority;
};
Phrase.prototype.toString = function(){
    return this.getTranslatedPercent() + "% translated; status: " + this.statuses[this.status] + " ; priority: " + this.priority;
};
Phrase.prototype.defineCountOfWords = function(){
    this.total = this.words.length;
};
Phrase.prototype.defineTranslatedWords = function(){
    /*
     * 1.пробігаємся по this.words 
     * 2.співставляємо слова з wordMap 
     * 3.зчитуємо параметр hasTranslation 
     * 4.повертаємо кіл-ть
     */
    var translated = 0;
    var priority = 0;
    for(var i in this.words){
        var wordObj = app.sub.getWordByIndex(this.words[i]);
        var hasTranslation = wordObj.getTranslationAvailability();
        if(hasTranslation){
            ++translated;
            //i це поряд слова у субтитрі, який має переклад
            try{
                var span = this.$phrase.children[++i];//div is 0 element
            }catch(e){console.warn(e);continue;}
            span.className = 'translated';
        }else {
            priority += wordObj.getCountOfPhrases();//формуємо пріоритет фрази
        }
    }
    this.translated = translated;
    this.priority = priority;
};
Phrase.prototype.getStatus = function(){
    return this.statuses[this.status];
};
Phrase.prototype.checkStatus = function(status){
    return status === this.statuses[this.status];
};
Phrase.prototype.getTranslatedPercent = function(){
    return Math.ceil(100 * this.translated / this.total);
};
/**
 * Перевіряє чи кіл-ть перекладених слів досягла 100%
 * Дивиться в якому поточному стані фраза та в які стани вона може перейти
 * @returns {undefined}
 */
Phrase.prototype.defineStatus = function(approval){
    /**
     * Дивимся в якому поточному стані фраза: 
     * status process може змінитись на waiting тільки різницею загальних слів до перекладених
     * status waiting можу змінитись на done тільки якщо юзер підтвердить кліком, а також може змінитись
     */
    var status = this.status;
    if(this.total === this.translated)
    {
        if(status === 0){this.status = 1;}
        if(status === 1 && approval)this.status = 2;
    }else {
        if(status === 2 || status === 1)this.status = 0;
    }
    //якщо фраза знаходиться в процесі, тоді прикріплюємо прогрес-бар
    (this.status === 0) ? this.atachProgressBar() : this.detachProgressBar();
    /*if(status !== this.status)*/this.changeStatus(status);
};
Phrase.prototype.changeStatus = function(status){
    /**
     * змінити вигляд показника готовності
     * змінити загальну пройденість субтитрів
     */
    var statusList = this.statuses;
    //console.log("Must have this class: " + statusList[this.status]);
    this.$phrase.firstChild.classList.remove(statusList[status]);//видаляємо старий клас
    this.$phrase.firstChild.classList.add(statusList[this.status]);//добавляємо новий клас
    if(this.status === 2){
        this.ready = true;
        try{
            app.sub.defineCountOfReadyPhrases();//TODO: створити даний метод для визначення кіл-ті готових фраз
        }catch(e){console.warn(e);}
    }
};
Phrase.prototype.atachProgressBar = function(){
    if(this.$phrase.firstChild.children.length === 0){
        this.progressBar = new ProgressBar(this.$phrase.firstChild);
        this.progressBar.init();
        this.progressBar.setValue(this.getTranslatedPercent());
    }else {
        this.progressBar.setValue(this.getTranslatedPercent());
    }
};
Phrase.prototype.detachProgressBar = function(){
    if(this.progressBar instanceof ProgressBar){
         this.progressBar.destroy();//видаляємо прогрес-контейнер
         delete this.progressBar; //видаляємо самий об'єкт
    }
};
