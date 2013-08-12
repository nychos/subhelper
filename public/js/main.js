(function($){
        $('document').ready(function(){
            app = $.sammy('#content', function() {

                // include the plugin
                this.use('Template', 'tmpl');

                this.get('#/', function(context) {
                    this.swap('');
                    //console.log(context.toString());
                    context.render('templates/main.tmpl').appendTo(context.$element()).then(function(){
                                   // Trigger post load events and hooks
                                   this.trigger('after-data-loaded');
                                   this.trigger('stop-processing');    
                    });
                    //console.log(context);
                });


//                this.get('#/texts', function(context) {
//                    this.swap('');
//                    var texts = typer.getTexts();
//
//                        context.render('templates/texts.tmpl', {data : texts}).appendTo(context.$element()).then(function(){
//                                       // Trigger post load events and hooks
//                                       this.trigger('after-texts-loaded');
//                                       this.trigger('stop-processing'); 
//                                       context.log("texts loaded");
//                                       $('.text').on('click', function(){
//                                          //console.log($(this).attr('id')); 
//                                          context.redirect('#/texts/'+$(this).attr('id'));
//                                       });
//                        });
//                });
//                 this.get('#/texts/:id', function(context) {
//                    this.swap('');
//                    var texts = typer.getTexts();
//                    var text = texts[this.params['id']];
//                    if(!text){this.notFound();}
//                        context.render('templates/text.tmpl', {data : text}).appendTo(context.$element()).then(function(){
//                                       // Trigger post load events and hooks
//                                       this.trigger('after-text-loaded', {id : context.params['id']});
//                                       this.trigger('stop-processing'); 
//                                       context.log("texts loaded");
//                        });
//                });
                this.bind('after-data-loaded', function(e,data){
                    //
                    console.log("data loaded");
                    $.ajax({
                        url : 'index/getsubtitle/',
                        data : {id : 1},
                        type : 'post',
                        success : function(response){
                            //console.log(response);
                           var obj = $.parseJSON(response);
                           console.log(obj);
                           if(obj.status === "success"){
                               $('#aside #original').html("<pre>" + obj.data.subtitle + "<pre>");
                               
                               if(typeof(obj.data.result) !== "string"){
                                    var str = "";
                                    for(var i in obj.data.result){
                                        var phrase = "<p>" + $.trim(obj.data.result[i]) + "</p>";
                                        str += phrase;
                                    }
                               }else {var str = obj.data.result;}
                               $('#aside #result').html("<pre>" + str + "<pre>");
                           }
                        }
                    });
                });
                this.bind('stop-processing', function(e,data){
                    //
                });

                });//app end

                app.run('#/');
        });//document.ready end
})(jQuery);
