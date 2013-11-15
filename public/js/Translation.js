/**
 * Для добавлення видалення та впорядкування перекладів різних Словників
 * @param {type} options
 * @returns {undefined}
 */
function Translation(options){
    this.word = options.word;
    this.translation = options.translation;
    this.data = options.data;
    this.content = options.content;
    this.dictionaryClass = '.dictionaryBody';
    console.log(options);
    this.init();
};
Translation.prototype.init = function(){
    this.$my = this.content.find('#myDictionary');
    this.$myBody = this.$my.find(this.dictionaryClass);
    this.$common = this.content.find('#commonDictionary');
    this.$commonBody = this.$common.find(this.dictionaryClass);
    this.$online = this.content.find('#onlineDictionary');
    this.$onlineBody = this.$online.find(this.dictionaryClass);
    this.$header = this.content.find("#translationCheckHeader");
    //можливість добавлення власного перекладу
    if(!(this.data.my && this.data.my.isMatched.match)){
        var button = this.createTranslationAddButton(); // створив кнопку
        
        var mouseenter = function(){
            button.addClass("hoveredAddTranslation");
        };
        var mouseleave = function(){
             button.removeClass("hoveredAddTranslation");
        };
        button.off('mouseenter').on('mouseenter', mouseenter);
        button.off('mouseleave').on('mouseleave', mouseleave);
        this.$header.off('mouseenter').on('mouseenter', mouseenter);
        this.$header.off('mouseleaeve').on('mouseleave', mouseleave);
    }
};
/**
 * Опрацьовує кліки по перекладам різних словників
 * @param {String} event
 * @param {Function} callback
 */
Translation.prototype.addTranslationEvent = function(event, callback){
     var self = this;
     var useOwnTranslation = function(){
        var package = {word: self.word, translation: self.translation};
        self.removeUserTranslationPossibility();
        callback(package);
     };
      var useOtherTranslation = function(){
       var $this = $(this), package = {};
       if($this.data('id-user'))package.id_user = $this.data('id-user'); // реферер
       if($this.data('id'))package.id = $this.data('id'); //якщо Народний Словник
       package.word = self.word; 
       package.translation = $this.text(); //переклад
       package.$this = $this;
       self.usedTranslation = $.extend({}, package);//містить всю інформацію про вибраний переклад,
       delete package.$this;
       callback(package);
    };
   
    this.$commonBody.find('button').on(event, useOtherTranslation);
    this.$onlineBody.find('button').on(event, useOtherTranslation);
    
    if(app.translate.translationAddButton instanceof jQuery){
        this.translationAddButton.off(event).on(event, useOwnTranslation);
        this.$header.off(event).on(event, useOwnTranslation);
    }
};
Translation.prototype.moveTranslation = function(content){
    //1. перемістили переклад у власний словник
    this.$myBody.append(content);
    //2. пошук на співпадіння
    this.checkMatch();
};
/**
 * Створює кнопку для добавлення перекладу
 * @returns {undefined}
 */
Translation.prototype.createTranslationAddButton = function(){
     var button = $('<span></span>', {class : 'addTranslation', text : this.translation});
     this.$myBody.append(button);
     this.translationAddButton = button;
     return button;
};
/**
 * Перевіряє чи переклад співпав, введеним користувачем, з Народним або Онлайн
 * @returns {undefined}
 */
Translation.prototype.checkMatch = function(){
    
    if(this.usedTranslation && this.usedTranslation.translation){
        console.log("usedTranslation");
        console.log(this.usedTranslation.$this);
        if(this.usedTranslation.translation === this.translation){
            this.removeUserTranslationPossibility();
        }
        this.hide(this.usedTranslation.$this);
    }else {
        console.log("my own translation used");
        this.removeSimilarTranslations(); // <= видаляє співпалі переклади з інших словників
    }
};
/**
 * Видаляє ймовірність добавлення перекладу введеним користувачем 
 * у випадку якщо переклад уже співпав з будь-яким словником
 * @returns {undefined}
 */
Translation.prototype.removeUserTranslationPossibility = function(){
    if(this.translationAddButton instanceof jQuery){
        this.translationAddButton.remove();
        this.$header.off();
        delete this.translationAddButton;
    }
};
/**
 * Вилучає переклади з інших словників, після добавлення перекладу в разі співпадіння
 * @returns {undefined}
 */
Translation.prototype.removeSimilarTranslations = function(){
        var self = this;
       //порівнюємо переклад введений користувачем з тими що в інших словниках
        var findSimilarTranslation = function(){
            var $this = $(this), //посилання на 
                translation = $this.text();
            console.log("button text: " + translation);
            console.log("self translation: " + self.translation);
            if(translation === self.translation){
                self.removeUserTranslationPossibility();
                self.hide($this);
                console.log("successfully removed");
                return false;
            }
        };
        this.$commonBody.find('button').each(findSimilarTranslation);
        this.$onlineBody.find('button').each(findSimilarTranslation);
};
/**
 * Вилучення об'єкту
 * @param {type} $this
 * @param {type} time
 * @returns {undefined}
 */
Translation.prototype.hide = function($this, time){
    console.log("gonna remove object");
    console.log($this);
    var time = time || 500;
    $this.animate({opacity: 0}, time, function(){ $this.remove();});
};

