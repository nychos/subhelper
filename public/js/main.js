(function($){
        $('document').ready(function(){
            app = $.sammy('#content', function() {
            // Override this function so that Sammy doesn't mess with forms
            this._checkFormSubmission = function(form) {return (false);};
            storage = new Storage();
            this.phraseStatusClass = "phraseStatus";
            //$('*').tipsy();
             $(".custom-select").each(function(){
                $(this).wrap("<span class='select-wrapper'></span>");
                $(this).after("<span class='holder'></span>");
            });
            function unescape(str) { return String(str).replace(/&lt;/g, "<").replace(/&gt;/g, ">");}
               // include the plugin
               this.use('Template', 'tmpl');

               this.get('#/', function(context) {
                    this.swap('');
                    context.render('templates/main.tmpl').appendTo(context.$element()).then(function(){
                        app.phrasesContainer = $('#phrasesContainer');
                        app.lightningCounter = document.getElementById("lightningCounter");
                        app.contentContainer = document.getElementById("content");
                        app.phraseStatusContainer = $('#phraseStatusContainer');
                        app.shadow = $('#shadow');
                      
                        this.trigger('ajax-start-and-stop');
                        //відображаємо фрази
                        this.trigger('show-phrases', {id : 1});
                    });
                    
                    
                });
                /**
                 * Показує прогрес бар
                 */
                this.bind('ajax-start-and-stop', function(){
                    $(document)
                    .ajaxStart(function(){
                       //show preloading
                        app.shadow.addClass('show').center('parent');
                        app.shadow.find('img').center('parent');
                    })
                    .ajaxStop(function(){
                        //hide preloading
                       app.shadow.removeClass('show');
                    });
                });
               /**
                * Показує імя фільтра з кнопкою закриття
                */
               this.bind('show-filter', function(e,data){
                   $('.filter').remove();
                   $('.word-dialog').remove();
                   var container = $('#aside');//TODO: винести звідси
                   //передаємо назву фільтра та функцію, що робити по закриті фільтра
                   this.render('templates/filter.tmpl', {data : data}).appendTo(container).then(function(content){
                       //кнопка закриття фільтра
                       $('.close_filter').off('click').on('click', function(){
                           $('.word-dialog').remove();
                           app.sub.sortByStatus();// <= app.sub.showAllPhrases();
                           $(this).parent().remove();//видаляємо фільтр
                           app.sub.restoreScrollPosition();// відновлюємо позицію скорола
                       });
                   });
               });
               /**
                * TODO: створити універсальний метод для закриття модальних вікон
                */
                this.bind('close-dialog', function(){
                  $(document).off('click').on('click', function(e){
                      var target = $(e.target);
                      var onPlate = target.closest(app.phraseStatusContainer).length;
                      console.log(target);
                      console.log(app.phraseStatusContainer);
                    if(!onPlate){
                          app.phraseStatusContainer.hide();
                          $(this).off('click');
                    }
                  });
               });
               /**
                * Відображає діалогове меню для слова
                */
               this.bind('find-translation', function(e, data){
                   $('.word-dialog').remove();//видаляємо поперднє діалогове вікно
                   var $this = this;
                   this.render('templates/word-dialog.tmpl', {data : data}).prependTo(app.phrasesContainer).then(function(content){
                       var wordDialog = $('.word-dialog');
                       //data.$this.tipsy({html: true, title : function(){return wordDialog.html();}, gravity: $.fn.tipsy.autoNS});
                       var dialogWidth = wordDialog.width();
                       $(document).off('click').on('click', function(e){
                           //console.log(e.target);
                           var onPlate = $(e.target).closest($('.word-dialog')).length;
                           var addButton = $(e.target).hasClass('addTranslation');//TODO: придумати краще рішення
                           if (onPlate || addButton) return;//якщо клік відноситься до діалогового вікна пропускаємо
                           wordDialog.remove();//в інакшому випадку видаляємо його
                           $(this).off('click');//забираємо обробник - він нам більше не потрібнийpo
                       });
                       app.trigger('normalize-word-dialog', data);
                       var arrow = wordDialog.find('.arrow').clone();
                       //wordDialog.css({left : data.coords.left, top: data.coords.top + 20});
                       wordDialog
                        .find('form').bind('submit', function(e){
                           wordDialog.width(dialogWidth * 1.5);
                          e.preventDefault();
                          var formData = $(this).serialize();
                          var arr = $(this).serializeArray();// => [translation, word]
                          var translation = arr[0].value;
                          var word = arr[1].value;
                          $.ajax({
                             url : 'index/find-translation/',
                             type : 'post',
                             data : formData,
                             success : function(response){
                                    var obj = $.parseJSON(response);
                                    if(obj.status === "success"){
                                        //якщо помінявся заряд до слова оновлюємо 
                                        if(obj.data.charge)app.dictionary.updateTranslationCharge(obj.data.charge);
                                        wordDialog.empty().prepend(arrow); //очищуємо контейнер і добавляємо стрілку
                                       //console.log("translation:" + translation + " word: " + word);
                                        $this.render('templates/translation-check-dialog.tmpl', {data : obj.data, word : word, translation : translation}).appendTo(wordDialog).then(function(content){
                                            //here I am
                                            app.trigger('normalize-word-dialog', data);
                                            app.translate = new Translation({translation: translation, word: word, data: obj.data, content : $('#translationCheckDialog')});

                                            app.translate.addTranslationEvent('click', function(formData){
                                                app.trigger('add-translation', formData);
                                            });
                                            app.translate.removeTranslationEvent('click', function(data){
                                               app.trigger('remove-translation', formData); 
                                            });
                                        });
                                    }else if(obj.status === "error"){
                                       //console.log(obj.message);
                                    }
                             }
                          });
                        })
                        .find('input[type=text]').focus();//фокусуємо поле для вводу перекладу
                       //показати всі фрази зі словом
                       $('#showWordPhrases').bind('click', function(){
                          app.trigger('show-filter', data);
                         //console.time("showSimilarPhrases");
                          app.sub.showSimilarPhrases(data);
                         //console.timeEnd("showSimilarPhrases");
                        });
                        
                       $('#showTranslation')
                           .bind('mouseenter', function(e){
                                e.preventDefault();
                                //пошук перекладу для даного слова
                                var word = data.word.toLowerCase();
                                var translation = app.dictionary.showTranslations(word);
                                if(!translation){
                                    var info = "No translation";
                                }else {
                                    var info = translation;
                                }
                                $(this).text(info);
                           })
                           .bind('mouseleave', function(e){
                                $(this).text("?");
                       });
                   });
               });
               this.bind('setup-progress-bar', function(e, data){
                   var phrasesProgressBar = document.getElementById('phrasesProgressBar');
                   //console.log(app.sub.data.title);
                   var subtitle = app.sub.data.title;
                   app.sub.setPhrasesProgressBar(phrasesProgressBar);
                   app.sub.triggerPhrasesProgressBar();
                   app.sub.phrasesProgressBar.setTextValue(subtitle);
               });
               /**
                 * Показує фрази зі субтитрів
                 */
               this.bind('show-phrases', function(e, data){
                 //перевіряємо локальне сховище 
                 var subObj = storage.checkItem("subtitles", data.id);
                 if(subObj){
                     //Отримали всю інформацію про субтитри: phrases, wordMap
                      app.sub = new Subtitle(subObj);
                      //console.log(app.sub.data.phrases);
                        //витягуємо дані та вставляємо в DOM
                        this.render('templates/phrases.tmpl', {data : app.sub.data.phrases}).then(function(content){
                            app.phrasesContainer.html(unescape(content));
                            app.sub.setPhrases($('.phrase'));//кешуємо фрази
                            app.trigger('setup-progress-bar');
                           //console.time("extendWithPhrase");
                            app.sub.extendPhraseObjectsWithPhraseAction(function(){
                                app.sub.triggerPhrasesProgressBar();
                                app.trigger('show-phrase-status');
                            });
                           //console.timeEnd("extendWithPhrase");
                            app.trigger('setup-dictionary');
                            app.sub.updateLightningCounter();
                            //наведення на фразу
                            $('.phrase').off('mouseenter').on('mouseenter', function(){
                                var id = $(this).data('phrase-id');
                                var phrase = app.sub.getPhrase(id);
                                //console.log("id: " + id + " data-phrase-id: " + phrase.$phrase.getAttribute("data-phrase-id"));
                                //console.log(phrase.toString());
                            });
                            
                            $("#sortSwitcher").off("click").on("click", function(){
                              //console.log("clicked");
                               var $this = $(this),
                                   isChecked = $this.is(":checked");
                               (isChecked)? app.sub.sortPhrases("priority") : app.sub.sortPhrases("index");
                            });
                            
                            $('#sortByStatus').off("change").on("change", function(){
                                var selected = $(this).find("option:selected").val();
                                $(this).next(".holder").text(selected);
                                console.log(selected);
                                $('.close_filter').trigger('click');
                                app.sub.sortByStatus(selected);
                            }).trigger('change');
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
                              //console.log(obj);
                               if(obj.status === "success"){
                                   var user = {};
                                   //додати субтитр якщо ідентифікатор субтитра унікальний
                                   var dictionary = obj.data.dictionary;
                                   user.lightnings = obj.data.lightnings;
                                   user.id_user = obj.data.id_user;
                                   delete obj.data.dictionary;
                                   delete obj.data.lightnings;
                                   delete obj.data.id_user;
                                   delete obj.data.timeProcess;
                                   storage.add("subtitles",obj.data);
                                   storage.add("user", user);
                                   app.trigger('setup-dictionary', dictionary);//приводимо локальний словник до готовності
                                   //рекурсивно викликаємо функцію
                                   app.trigger('show-phrases', {id : data.id});
                               }
                            }
                        });//ajax end
                    }
                    this.trigger('phrases-loaded');
                });
               /**
                * Налаштовує локальний словник до роботи
                */
               this.bind('setup-dictionary', function(e, dictionary){
                    if(!storage.checkItem("dictionary")){
                        if(typeof dictionary !== 'object')throw new Error('dictionary is not defined!');
                        storage.add("dictionary",dictionary);//TODO: чи не потребує оновлення
                    }else {
                        var dictionary = storage.get("dictionary")[0];
                    }
                    app.dictionary = new Dictionary(dictionary);
                    //console.log(app.dictionary);
                });
               /*
                * пошук фраз по слову
                */
               this.bind('phrases-loaded', function(){
                    //при нажаті на слово
                    app.phrasesContainer.off('click').on('click','.phrase span', function(){
                         var $this = $(this);
                         //$this.tipsy({html: true, title : function(){return "<h1>Nychos</h1>";}, gravity: $.fn.tipsy.autoNS});
                         //слово знайти у wordMap
                         var word = $this.text().toLowerCase();
                         //посилання на фрази, самі фрази та їх кількість
                         var wordObj = app.sub.getWord(word);
                         var countPhrases = wordObj.getCountOfPhrases();
                         var source = wordObj.getPhrasesIndexes();
                         //зберігаємо стан скролінгу
                          app.contentScroll = $(this).position().top;
                         //відображення діалогового вікна для слова
                         app.trigger('find-translation', {word : word, source : source, count : countPhrases, coords : $this.position(), $this: $this});
                     }); 
                });
               /*добавлення перекладу*/
               this.bind('add-translation', function(e, data){
                    //console.log(data);
                    $.ajax({
                       url : 'index/add-translation',
                       type : 'post',
                       data : data,// <= word, referrer, id_translation, translation
                       success : function(response){
                           var obj = $.parseJSON(response);
                           if(obj.status === "success"){
                               //дане поле вказує що дані змінились на сервері, тому оновлюємо на клієнті
                               if(obj.data.hasOwnProperty("lightnings")){
                                   app.sub.updateLightnings(obj.data.lightnings, function(){
                                      app.sub.updateLightningCounter(); 
                                      delete obj.data.lightnings;
                                   });
                               }
                                app.trigger('translation-replace', obj.data);
                                app.trigger('add-translation-to-dictionary', data);
                           }else {
                                //console.warn(response);
                           }
                       }
                    });
                });
               /*видалення перекладу*/
               this.bind('remove-translation', function(e, data){
                    //console.log(data);
                    var $this = data.$this;
                    delete data.$this;
                    $.ajax({
                       url : 'index/remove-translation',
                       data : data,//id : data.id, word : data.word
                       type : 'post',
                       success : function(response){
                           app.translate.hide($this);
                           //app.trigger('remove-word-from-dictionary');//TODO:видалити переклад з локального словника
                       }
                    });
                });
               /**
                 * При добавлені перекладу у власний Словник, формує відповідну кнопку
                 */
               this.bind('translation-replace', function(e,data){
                   //console.log(data);
                    //генеруємо кнопку з даними і вставляємо її до решти власних перекладів
                    this.render('templates/translation-item.tmpl', data).then(function(content){
                        //1. перемістили запозичене слово
                        //2. видалили оригінал
                        //3.перевірити на співпадіння в Загальному або Онлайн словнику
                       app.translate.moveTranslation(content); 
                    }); 
                });
               this.bind('normalize-word-dialog', function(e, data){
                    if(data.coords) app.coords = data.coords;
                    var dialog = $('.word-dialog');
                    var containerWidth = app.phrasesContainer.width(); //1.межі контейнера
                    var width = dialog.outerWidth(); // 2. ширина діалога
                    var right = width + app.coords.left; // 3. визначаємо праву межу
                    var rightEdge = null;
                    var css = {};
                    var arrowCss = {};
                    var buttonWidth = data.$this.width();
                    var middleButton = buttonWidth / 2;
                    // 5. якщо права межа переходить праву межу контейнера,
                    // змінюємо розташування, щоб вікно вмістилось 
                    if(right > containerWidth) {
                        rightEdge = containerWidth - data.coords.left - buttonWidth;
                        css.right = rightEdge;
                        arrowCss.right = middleButton;
                    }else {
                        css.left = app.coords.left;
                        arrowCss.left = middleButton;
                    }
                    css.top = app.coords.top + 50;
                    dialog
                       .css(css)
                       .animate({opacity: 1}, 500)
                       .find('.arrow').css(arrowCss);
               });
               /**
                 * Добавлення перекладу в локальний словник
                 */
               this.bind('add-translation-to-dictionary', function(e, data){
                    var result = app.dictionary.addTranslation(data.word, data.translation);
                    if(result){
                        app.sub.triggerPhrasesProgressBar();
                    }
                });
                /**
                 * Показує інформацію для фрази при кліку на коло біля фрази
                 */
               this.bind('show-phrase-status', function(e, data){
                  var phraseStatusClass = "." + app.phraseStatusClass;
                  var context = this;
                  //app.phraseStatusContainer.remove();
                   $(phraseStatusClass).off('click').on('click', function(){
                      var $this = $(this);
                      var data = {};
                      data.phrase_id = parseInt($this.parent().data('phrase-id'));
                      var coords = $this.position(); // coords.left coords.right
                      coords.top += 50;
                      app.phraseStatusContainer.empty().css(coords).show();
                      var phrase = app.sub.getPhrase(data.phrase_id);
                      var data = {};
                      data.status = phrase.getStatus();
                      data.priority = phrase.getPriority();
                      context.render('templates/phrase-status-'+ data.status +'.tmpl', data).prependTo(app.phraseStatusContainer).then(function(){
                          app.trigger('close-dialog');
                          $('#update-phrase-translation').on('submit', function(){
                             var translation = $(this).find('textarea').val();
                             console.log(translation);
                             if(translation){
                                 data.translation = translation;
                                 app.trigger('update-phrase-translation', data);
                             }
                             return false;
                          });
                      });
                      //console.log(coords);
                      //console.log("phraseId " + phraseId);
                   }); 
               });
               this.bind('update-phrase-translation', function(e, data){
                  $.ajax({
                     url : 'index/update-phrase-translation',
                     data : data, // <= phrase_id, translation
                     success : function(response){
                         console.log(response);
                     }
                  });
               });
               });//app end

                app.run('#/');
        });//document.ready end
})(jQuery);
