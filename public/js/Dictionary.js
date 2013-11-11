function Dictionary(obj){
    this.dictionary = obj;
};
Dictionary.prototype.updateDictionary = function(){
    storage.save("dictionary", this.dictionary);
};
Dictionary.prototype.addTranslation = function(word, translation){
    //1. перевірка чи слово міститься в словнику, якщо так то добавляємо переклад, якщо ні створюємо слово і тоді добавляємо переклад
    var translationArr = this.getTranslations(word);
    var translationObj = {"translation" : translation, "charge" : 0};
    if(translationArr instanceof Array){
        //переклад уже є для даного слова, тому добавляємо в кінець масиву новий переклад
        translationArr.push(translationObj);
    }else {
        var firstLetter = app.sub.getFirstLetter(word);
        if(this.dictionary.hasOwnProperty(firstLetter)){
            this.dictionary[firstLetter][word] = [translationObj];
        }else {
            var obj = {};
            Object.defineProperty(obj, word, {
                value : [translationObj],
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
Dictionary.prototype.getTranslations = function(word){
    var firstLetter = app.sub.getFirstLetter(word);
    for(var i in this.dictionary){
        if(firstLetter === i){
            return this.dictionary[i][word];
        }
    }
    return false;
};
Dictionary.prototype.showTranslations = function(word){
    var arr = this.getTranslations(word);
    var translations = [];
    for(var i in arr){
       translations.push(arr[i].translation);
    }
    return translations.join(", ");
}
/**
 * Оновлюємо заряд для перекладу
 * @param {Array} arr
 * @returns {Boolean}
 */
Dictionary.prototype.updateTranslationCharge = function(arr){
    //1.знаходимо слово arr.word
    //2. переклад в якого змінився заряд arr.translation
    //3. оновлюємо заряд  arr.charge
    var word = arr.word;
    var firstLetter = app.sub.getFirstLetter(word);
    var obj = app.dictionary instanceof Dictionary && app.dictionary.dictionary[firstLetter][word];
    for(var i in obj){
       if(obj[i].translation === arr.translation){
           obj[i].charge = arr.charge;
           this.updateDictionary();
           return true;
       }
    }
    throw new Error("translation not found");
};
/**
 * Визначає середнє арифметичне зарядів перекладів
 * @param {String} word
 * @returns {Number|Boolean}
 */
Dictionary.prototype.getWordCharge = function(word){
    var arr = [];
    var sum = 0;
    if(arr = this.getTranslations(word)){
        for(var i in arr){
            sum += arr[i].charge;
        }
        return sum / arr.length;
    }else {
        return false;
    }
};
Dictionary.prototype.getFullDictionaryCharge = function(){
    var sum = 0;
    var counter = 0;
    for(var i in this.dictionary){
       var letter = this.dictionary[i];
       for(var j in letter){
           var word = letter[j];
           for(var k in word){
               ++counter;
               if(word[k].charge){
                   sum += word[k].charge;
               }
           }
       }
    }
    var full = counter * 10;
    var percent = (sum * 100 / full) + "%";
    return {"sum" : sum, "count" : counter, "full" : full, percent : percent};
};