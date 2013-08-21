(function($){
        $('document').ready(function(){
            app = $.sammy('#content', function() {
            storage = new Storage();
            var phrasesContainer = $('#aside #result');
            var originalContainer = $('#aside #original');
            function unescape(str) { return String(str).replace(/&lt;/g, "<").replace(/&gt;/g, ">");}
                // include the plugin
                this.use('Template', 'tmpl');

                this.get('#/', function(context) {
                    this.swap('');
                    context.render('templates/main.tmpl').appendTo(context.$element()).then(function(){
                                   // Trigger post load events and hooks
                                   //відображаємо фрази
                                   this.trigger('show-phrases', {id : 1});
                    });
                });
                 /**
                * Показує імя фільтра з кнопкою закриття
                */
               this.bind('show-filter', function(e,data){
                   $('.filter').remove();
                   $('.word-dialog').remove();
                   //передаємо назву фільтра та функцію, що робити по закриті фільтра
                   this.render('templates/filter.tmpl', {data : data}).appendTo(this.$element()).then(function(content){
                       //console.log(content);
                       //кнопка закриття фільтра
                       $('.close_filter').bind('click', function(){
                           $('.word-dialog').remove();
                           $('.phrase').show().children().removeClass('activeWord');
                           $(this).parent().remove();//видаляємо фільтр
                       });
                   });
               });
               /**
                * Відображає діалогове меню для слова
                */
               this.bind('show-word-dialog', function(e, data){
                   $('.word-dialog').remove();
                   this.render('templates/word-dialog.tmpl', {data : data}).prependTo($('#result')).then(function(content){
                       var wordDialog = $('.word-dialog');
                       wordDialog.css({left : data.coords.left, top: data.coords.top + 20});
                       wordDialog.find('form').bind('submit', function(e){
                          e.preventDefault();
                          var data = $(this).serializeArray()[0];
                          console.log(data);
                          $.ajax({
                             url : 'index/check-translation/',
                             type : 'post',
                             data : {"translation" : data.value},
                             success : function(response){
                                 console.log(response);
                             }
                          });
                       });
                       $('#showWordPhrases').bind('click', function(){
                          app.trigger('show-filter', data);
                          //TODO: залишити тільки фрази зі словом
                          app.sub.showSimilarPhrases(data.filterName, $('.phrase'));
                        });
                   });
               });
                /**
                 * Показує фрази зі субтитрів
                 * @type Arguments
                 */
                this.bind('show-phrases', function(e, data){
                 //перевіряємо локальне сховище 
                 var phraseObj = storage.checkItem("subtitles", data.id);
                 app.sub = new Subtitle(phraseObj);
                 //app.phrases = phraseObj;
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
                    //при нажаті на слово
                    $('#result').on('click','span', function(){
                        var $this = $(this);
                         var word = $this.text().toLowerCase();
                         //посилання на фрази, самі фрази та їх кількість
                         var obj = app.sub.fetchWordPhrases(word);
                         //відображення діалогового вікна для слова
                         app.trigger('show-word-dialog', {filterName : word, count : obj.count, coords : $this.position()});
                     }); 
                });
                });//app end

                app.run('#/');
        });//document.ready end
})(jQuery);
