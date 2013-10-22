function Dictionary(obj){
    this.dictionary = obj;
};
Dictionary.prototype.updateDictionary = function(){
    storage.save("dictionary", this.dictionary);
};
Dictionary.prototype.addTranslation = function(word, translation){
    //1. перевірка чи слово міститься в словнику, якщо так то добавляємо переклад, якщо ні створюємо слово і тоді добавляємо переклад
    var translationArr = this.getTranslation(word);
    if(translationArr instanceof Array){
        //переклад уже є для даного слова, тому добавляємо в кінець масиву новий переклад
        translationArr.push(translation);
    }else {
        var firstLetter = app.sub.getFirstLetter(word);
        if(this.dictionary.hasOwnProperty(firstLetter)){
            this.dictionary[firstLetter][word] = [translation];
        }else {
            var obj = {};
            Object.defineProperty(obj, word, {
                value : [translation],
                writable: true,
                enumerable: true,
                configurable: true
            });
            this.dictionary[firstLetter] = obj;
        }
        //змінюємо наявність перекладу у wordMap
        var wordObj = app.sub.getWord(word);
        wordObj.setTranslationStatus(true);//1.вказали наявність перекладу
        var phrasesIndexes = wordObj.getPhrasesIndexes();//2. витянули індекси фраз
        for(var i in phrasesIndexes){
            var phraseId = phrasesIndexes[i];
            var phrase = app.sub.getPhrase(phraseId);
            phrase.defineTranslatedWords();//3. витянули обєкт фрази і перевизначили кіл-ть перекладених слів
            phrase.defineStatus();//4. перевизначили стан фрази
        }
        try{
            app.sub.updateStorage();//всі зміни записали у локальне сховище
        }catch(e){
            console.warn(e.message());
        }
    }
    try{
        this.updateDictionary();//оновлюємо словник
    }catch(e){
        console.warn(e.message());
    }
    return true;
};
/**
 * Витягує переклад (масив перекладів) до слова
 * @param {String} word
 * @returns Array of translations
 */
Dictionary.prototype.getTranslation = function(word){
    var firstLetter = app.sub.getFirstLetter(word);
    for(var i in this.dictionary){
        if(firstLetter === i){
            return this.dictionary[i][word];
        }
    }
};