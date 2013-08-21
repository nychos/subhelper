
function Subtitle(data){
    if(typeof(data) !== "object"){
        throw new Error("Data is empty");
    }
    this.phraseMap = data.wordMap;
    this.data = data;
};
/**
 * 
 * @param {String} word
 * @param {Object} phraseMap
 * @returns {undefined}
 */
Subtitle.prototype.findPhrasesReferences = function(word){
    for(var i in this.phraseMap){
        if(this.phraseMap[i].word.toLowerCase() === word){
            return this.phraseMap[i].source;
        }
    }
    throw new Error("Word " + word + " not found");
};
/**
 * Витягує усі фрази зі словом
 * @param {String} word
 * @returns {Object}
 */
Subtitle.prototype.fetchWordPhrases = function(word){
    var source = this.findPhrasesReferences(word);
     if(source){
        var phrases = [];
        for(var i in source){
           phrases.push(this.data.phrases[i]);
        }
        return {phrases : phrases, source : source, count : source.length};
    }
    throw new Error("source is undefined");
};
/**
 * Витягує усі фрази зі словом
 * @param {String} word
 * @returns {Object}
 */
Subtitle.prototype.showSimilarPhrases = function(word, phraseDiv){
    var source = this.findPhrasesReferences(word);
    phraseDiv.hide();//сховали усі фрази
     if(source){
        for(var i in source){
            phraseDiv.each(function(j){
                var phrase = $(this);
                if(source[i] === j){
                    phrase.show();//.addClass('activeWord');//показали тільки ті що містять слово
                    phrase.children().each(function(){
                        var text = $(this).text().toLowerCase();
                        if(text === word){
                            $(this).addClass('activeWord');
                        }
                    })
                }
            });
        }
    }else {
        throw new Error("source is undefined");
    }
};


