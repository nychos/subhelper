(function($){
        $('document').ready(function(){
            app = $.sammy('#content', function() {
            storage = new Storage();
            var phrasesContainer = $('#aside #result');
            function unescape(str) { return String(str).replace(/&lt;/g, "<").replace(/&gt;/g, ">");}
                // include the plugin
                this.use('Template', 'tmpl');

                this.get('#/', function(context) {
                    this.swap('');
                    context.render('templates/main.tmpl').appendTo(context.$element()).then(function(){
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
                   //$('#translationCheckDialog').remove();
                   var $this = this;
                   this.render('templates/word-dialog.tmpl', {data : data}).prependTo($('#result')).then(function(content){
                       var wordDialog = $('.word-dialog');
                       wordDialog.css({left : data.coords.left, top: data.coords.top + 20});
                       wordDialog.find('form').bind('submit', function(e){
                          e.preventDefault();
                          var data = $(this).serialize();
                          var arr = $(this).serializeArray();
                          var word = arr[1].value;
                          var translation = arr[0].value;
                          $.ajax({
                             url : 'index/find-translation/',
                             type : 'post',
                             data : data,
                             success : function(response){
                                 try{
                                    var obj = $.parseJSON(response);
                                    if(obj.status === "success"){
                                        console.log(obj);
                                        $('.word-dialog').empty();
                                        $this.render('templates/translation-check-dialog.tmpl', {data : obj.data, word : word, translation : translation}).prependTo($('.word-dialog')).then(function(content){
                                           //показати переклад у власному списку
                                           var my = $('#myDictionary');
                                           var body = my.find('.dictionaryBody');
                                           //перевірка перекладу з усіма словами з словнику
                                           //якщо збігається тоді не пропонувати добавити а просто
                                          
                                           var translationDiv = $('<span></span>', {class : 'addTranslation', text : translation});
                                           //console.log(obj.data.my.isMatched.match);
                                           //якщо немає співпадінь, тоді пропонуємо добавити слово
                                           if(obj.data.my && obj.data.my.isMatched.match === 1){
                                                //TODO: слово співпало
                                           }else {
                                               $('#translationCheckHeader')
                                                .bind('mouseenter', function(){
                                                    my.find('.noRecords').hide();//приховуємо запис no records
                                                    app.cacheHtml = body.html();//кешуємо переклади
                                                    body.append(translationDiv);//добавляємо переклад до списку
                                               })
                                               .bind('mouseleave', function(){
                                                    if(app.cacheHtml){
                                                        body.html(app.cacheHtml);//витягуємо дані з кешу
                                                        body.find('.noRecords').show();
                                                        app.cacheHtml = null;
                                                    }
                                               });
                                           }
                                        });
                                    }else if(obj.status === "error"){
                                        console.log(obj.message);
                                    }
                                 }catch(e){
                                     console.log(e);
                                 }
                             }
                          });
                       });
                       //показати всі фрази зі словом
                       $('#showWordPhrases').bind('click', function(){
                          app.trigger('show-filter', data);
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

                 if(phraseObj){
                      app.sub = new Subtitle(phraseObj);
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
                                //console.log(response);
                               var obj = $.parseJSON(response);
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
                    $('#result').on('click','.phrase span', function(){
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
