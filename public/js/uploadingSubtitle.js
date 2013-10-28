    //зміна кнопки завантаження
    $("#uploadSubtitle")
        .on('change','#file',function(){
            console.log("file triggered");
            if($("#file").val()!=''){
                    $('#notice').text("Uploading in progress...").fadeIn();
                    $("#upload_big").submit();
            }
            else {
                    $('.notice').hide();
            }
        })
     //після завантаження файлу
        .bind('submit','.uploaderForm', function(){
            console.log("form submitted");
            var $this = $(this);
           //витягуємо імя тимчасового файлу
           $('#upload_target').unbind().load( function(){
               var response = $('#upload_target').contents().find('body ').html();	
               response = $.parseJSON(response);
               if(response.status === "success"){
                    //статус завантаження
                    $('#notice').html(response.message);
                    //записуємо шлях тимчасової картинки в приховане поле форми
               }else {
                   $('#notice').html(response.message);
               }
           });//upload_target end
        });//bind end


