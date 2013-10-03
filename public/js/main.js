(function($){
        $('document').ready(function(){
            app = $.sammy('#content', function() {
            storage = new Storage();
            function unescape(str) { return String(str).replace(/&lt;/g, "<").replace(/&gt;/g, ">");}
            function Translate(){};
            Translate.prototype.removeObject = function($this, time){
                var time = time || 500;
                $this.animate({opacity: 0}, time, function(){ $this.remove();});
            };
            var translate = new Translate();//обєкт для операцій з перекладами
                // include the plugin
                this.use('Template', 'tmpl');

                this.get('#/', function(context) {
                    this.swap('');
                    context.render('templates/main.tmpl').appendTo(context.$element()).then(function(){
                        $('#shadow').appendTo('#content');//TODO: перенести в Main.tmpl
                        app.phrasesContainer = $('#result');
                        //відображаємо фрази
                        this.trigger('show-phrases', {id : 3});
                    });
                    
                    $(document)
                    .ajaxStart(function(){
                       //show preloading
                       $('#shadow').show().center('parent');
                        $('#shadow img').center('parent');
                    })
                    .ajaxStop(function(){
                        //hide preloading
                       $('#shadow').hide();
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
                       //console.log(content);
                       //кнопка закриття фільтра
                       $('.close_filter').bind('click', function(){
                           console.time("closeFilter");
                           $('.word-dialog').remove();
                           $('.phrase').show().children().removeClass('activeWord');
                           $(this).parent().remove();//видаляємо фільтр
                           console.timeEnd("closeFilter");
                       });
                   });
               });
               /**
                * Відображає діалогове меню для слова
                */
               this.bind('show-word-dialog', function(e, data){
                   $('.word-dialog').remove();
                   var $this = this;
                   this.render('templates/word-dialog.tmpl', {data : data}).prependTo($('#result')).then(function(content){
                       var wordDialog = $('.word-dialog');
                       wordDialog.css({left : data.coords.left, top: data.coords.top + 20});
                       wordDialog.find('form').bind('submit', function(e){
                          e.preventDefault();
                          var data = $(this).serialize();
                          var arr = $(this).serializeArray();// => [translation, word]
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
                                        //console.log(obj.data);
                                        $('.word-dialog').empty();
                                        $this.render('templates/translation-check-dialog.tmpl', {data : obj.data, word : word, translation : translation}).prependTo($('.word-dialog')).then(function(content){
                                           //показати переклад у власному списку
                                           var my = $('#myDictionary');
                                           var body = my.find('.dictionaryBody');
                                           var header = $('#translationCheckHeader');
                                           header.data('translation', translation);
                                           header.data('word', word);
                                           //перевірка перекладу з усіма словами з словнику
                                           //якщо збігається тоді не пропонувати добавити а просто
                                          
                                           var translationDiv = $('<span></span>', {class : 'addTranslation', text : translation});
                                           //console.log(obj.data.my.isMatched.match);
                                           //якщо немає співпадінь, тоді пропонуємо добавити слово
                                           if(obj.data.my && obj.data.my.isMatched.match === 1){
                                                //TODO: слово співпало
                                           }else {
                                               header
                                                .on('mouseenter', function(){
                                                    my.find('.noRecords').hide();//приховуємо запис no records
                                                    app.cacheHtml = body.html();//кешуємо переклади
                                                    body.append(translationDiv);//добавляємо переклад до списку
                                               })
                                               .on('mouseleave', function(){
                                                    if(app.cacheHtml){
                                                        body.html(app.cacheHtml);//витягуємо дані з кешу
                                                        body.find('.noRecords').show();
                                                        app.cacheHtml = null;
                                                    }
                                               })
                                               .on('click', function(){
                                                    /* записуємо слово в словник користувача
                                                     * але спочатку перевіряємо в загальному словнику, 
                                                     * чи даний переклад міститься
                                                     */
                                                    var $this = $(this);
                                                    var options = {};
                                                    options.word = word;
                                                    options.translation = translation;
                                                    if(obj.data.common && obj.data.common.isMatched.match === 1){
                                                        //переклад уже міститься в базі, нам потрібно просто його ідентифікатор
                                                        for(var i in obj.data.common){
                                                            var data = obj.data.common;
                                                            if(data[i].translation === translation){ 
                                                                options.id_translation = data[i].id;
                                                                delete options.translation;
                                                                app.trigger('add-translation', options);
                                                               break;
                                                            }
                                                        }
                                                    }else {
                                                        //add new word translation word
                                                       app.trigger('add-translation', options);
                                                    }
                                                    header.off();
                                                    $('.addTranslation').remove();
                                               });
                                           }//else
                                           $('#commonDictionary').on('click','button', function(){
                                                  var $this = $(this);
                                                  var obj = {};
                                                  obj.id_translation = $this.data('id');
                                                  obj.id_user = $this.data('id-user');
                                                  obj.word = word;
                                                  obj.translation = $this.text().trim();
                                                  obj.$this = $this;
                                                  app.trigger('add-translation', obj);
                                            });
                                            //bind vs. on - різниця очевидна event тільки на елементи button, а bind на всі елементи що між ними
                                            $('#myDictionary').on('click','button', function(e){
                                               var $this = $(this);
                                               var obj = {};
                                               obj.id = $this.data('id');
                                               obj.id_user = $this.data('id-user');
                                               obj.translation = $this.text().trim();
                                               obj.word = word;
                                               obj.$this = $this;
                                               app.trigger('remove-translation', obj);
                                            });
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
                          console.time("showSimilarPhrases");
                          app.sub.showSimilarPhrases(data.filterName, $('.phrase'));
                          console.timeEnd("showSimilarPhrases");
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
                            app.phrasesContainer.html(unescape(content));
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
                         //console.log(obj);
                         //відображення діалогового вікна для слова
                         app.trigger('show-word-dialog', {filterName : word, count : obj.count, coords : $this.position()});
                     }); 
                });
                /*добавлення перекладу*/
                this.bind('add-translation', function(e, data){
                    console.log(data);
                    var package = {};
                    if(data.$this){
                        package.$this = data.$this;//посилання на HTML object перекладу
                        delete data.$this;
                    }else {
                        //видаляємо подібний переклад з загальному словнику, якщо користувацьки співпав
                        $('#commonDictionary button').each(function(){
                           var $this = $(this);
                           var id = data.id || data.id_translation;
                           if($this.data('id') === id)translate.removeObject($this);
                        });
                    }
                    $.ajax({
                       url : 'index/add-translation',
                       type : 'post',
                       data : data,// <= word, referrer, id_translation, translation
                       success : function(response){
                           var obj = $.parseJSON(response);
                           if(obj.status === "success"){
                                package.id = obj.data.id;// <= 1. obj.data.id 
                                if(obj.data.id_user)package.id_user = obj.data.id_user;// 2. <= obj.data.id_user;
                                if(data.translation)package.translation = data.translation; // 3.
                                package.destination = $('#myDictionary .dictionaryBody');
                                // передати дані на шаблон перекладу і вставити його до власного словника
                                console.log(package);
                                app.trigger('translation-replace', package);
                           }else {
                                 console.log(response);
                           }
                       }
                    });
                });
                /*видалення перекладу*/
                this.bind('remove-translation', function(e, data){
                    //console.log(data);
                    data.destination = $('#commonDictionary .dictionaryBody');
                    $.ajax({
                       url : 'index/remove-translation',
                       data : {id : data.id, word : data.word},
                       type : 'post',
                       success : function(response){
                           //console.log(response);
                           app.trigger('translation-replace', data);
                       }
                    });
                });
                this.bind('translation-replace', function(e,data){
                    //console.log(data);
                    var destination = data.destination;
                    var obj = {};
                    if(data.id)obj.id = data.id;
                    if(data.id_user)obj.id_user = data.id_user;
                    //else obj.id_user = 1;//default user from session
                    if(data.translation){
                        obj.translation = data.translation;
                    }else {obj.translation = $('#translationCheckHeader').data('translation').trim();}
                    //console.log(obj);
                    this.render('templates/translation-item.tmpl', obj).then(function(content){
                        //console.log(content);
                        //1. перемістили запозичене слово
                        destination.append(content);
                        //2. видалили оригінал
                        if(data.$this) translate.removeObject(data.$this);
                    }); 
                });
                });//app end

                app.run('#/');
        });//document.ready end
})(jQuery);
