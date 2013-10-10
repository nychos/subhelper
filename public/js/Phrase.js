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
    return Math.ceil(this.getTranslatedPercent()) + "% translated; status: " + this.statuses[this.status] + " ; priority: " + this.priority;
};
Phrase.prototype.sortByPriority = function(){
    var phrases = app.sub.data.phrases;
    console.time("sort");
    var sortPhrases = phrases.sort(function(a,b){
        return (a.priority < b.priority) ? 1 : -1;
    });
    var arr = [];
    for(var i in sortPhrases){
       arr.push(sortPhrases[i].$phrase/*.cloneNode(true)*/);
    }
    //arr;
    console.timeEnd("sort");
    var container = document.getElementsByClassName("subtitle")[0];
    console.time("remove");
    container.innerHTML = "";
    console.timeEnd("remove");
    console.time("append");
    for(var i in arr){
        container.appendChild(arr[i]);
    }
    console.timeEnd("append");
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
            var span = this.$phrase.children[i];
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
Phrase.prototype.getTranslatedPercent = function(){
    return 100 * this.translated / this.total;
};
/**
 * Перевіряє чи кіл-ть перекладених слів досягла 100%
 * Дивиться в якому поточному стані фраза та в які стани вона може перейти
 * @returns {undefined}
 */
Phrase.prototype.defineStatus = function(approval){
    /**
     * Дивимся в якому поточному стані фраза: 
     * status process може змінитиьс на waiting тільки різницею загальних слів до перекладених
     * status waiting можу змінитись на done тільки якщо юзер підтвердить кліком, а також може змінитись
     */
    var status = this.status;
    if(this.total === this.translated){
        if(status === 0){this.status = 1;}
        if(status === 1 && approval)this.status = 2;
    }else {
        if(status === 2 || status === 1)this.status = 0;
    }
    if(status !== this.status)this.changeStatus(status);
};
Phrase.prototype.changeStatus = function(status){
    /**
     * змінити вигляд показника готовності
     * змінити загальну пройденість субтитрів
     */
    //console.log("status from %s to %s has been changed!", this.statuses[status], this.statuses[this.status]);
    //$(this.$phrase).find('img').className = this.statuses[this.status];
    var statusList = this.statuses;
    this.$phrase.classList.remove(statusList[status]);//видаляємо старий клас
    this.$phrase.classList.add(statusList[this.status]);//добавляємо новий клас
    if(this.status === 2){
        this.ready = true;
        try{
            app.sub.defineCountOfReadyPhrases();
        }catch(e){console.warn(e.getMessage());}
    }
};
