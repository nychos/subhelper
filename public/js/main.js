(function($){
        $('document').ready(function(){
            app = $.sammy('#content', function() {
            storage = new Storage();
            var phrasesContainer = $('#aside #result');
            function unescape(str) {
                return String(str).replace(/&lt;/g, "<").replace(/&gt;/g, ">");
            }
                // include the plugin
                this.use('Template', 'tmpl');

                this.get('#/', function(context) {
                    this.swap('');
                    context.render('templates/main.tmpl').appendTo(context.$element()).then(function(){
                                   // Trigger post load events and hooks
                                   //відображаємо фрази
                                   this.trigger('show-phrases', {id : 1});
//                                    $.ajax({
//                                        url : 'index/get-subtitle/',
//                                        data : {id : 1},
//                                        type : 'post',
//                                        success : function(response){
//                                            console.log(response);
//                                        }
//                                    });
                    });
                });
                /**
                 * Показує фрази зі субтитрів
                 * @type Arguments
                 */
                this.bind('show-phrases', function(e, data){
                 //перевіряємо локальне сховище 
                 var phraseObj = storage.checkItem("subtitles", data.id);
                 app.phrases = phraseObj;
                 if(phraseObj){
                        //витягуємо дані та вставляємо в DOM
                        this.render('templates/phrases.tmpl', {data : phraseObj}).then(function(content){
                            phrasesContainer.html(unescape(content));
                        });
                    }else {
                        //запит до сервера відбуватиметься тільки, якщо даних в локальному сховищі немає
                        $.ajax({
                            url : 'index/get-subtitle/',
                            //dataType : 'json',
                            data : {id : data.id},
                            type : 'post',
                            success : function(response){
                                console.log(response);
                               var obj = $.parseJSON(response);
                               console.log(obj);
                               if(obj.status === "success"){
                                   //додати субтитр якщо ідентифікатор субтитра унікальний
                                   storage.add("subtitles",obj.data);
                                   //рекурсивно викликаємо функцію
                                   app.trigger('show-phrases', {id : data.id});
                               }
                            }
                        });//ajax end
                    }
                    this.trigger('phrases-loaded');
                });
                //пошук фраз по слову
                this.bind('phrases-loaded', function(){
                    console.log("phrases-loaded");
                    $('#result').on('click','span', function(){
                         var word = $(this).text().toLowerCase();
                         //console.log(app.phrases);
                         var data = app.phrases;
                         console.log(data);
                         var source = findWord(word, data.wordMap);
                         console.log(source);
                         var phrases = fetchPhrases(source);
                         //console.log(phrases);
                         function findWord(word, wordMap){
                             for(var i in wordMap){
                                if(wordMap[i].word.toLowerCase() === word){
                                    console.log("Word found!");
                                    console.log(wordMap[i]);
                                    return wordMap[i].source;
                                }
                            }
                            throw new Error("Word " + word + " not found");
                         }
                         function fetchPhrases(source){
                             if(source){
                                 var phrases = [];
                                 for(var i in source){
                                     console.log(data.phrases[source[i]]);
                                     $('.phrase').each(function(j){
                                        if(source[i] === j)$(this).css("backgroundColor", "yellow");
                                     });
                                    phrases.push(data.phrases[i]);
                                 }
                                 return phrases;
                             }
                             throw new Error("source is undefined");
                         }
                         
                         
                     }); 
                });

                });//app end

                app.run('#/');
        });//document.ready end
})(jQuery);
