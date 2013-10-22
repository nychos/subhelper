/**
 * 
 * @desc Плагін для відцентровування елементів відносно
 * @author nychka08@yandex.com
 */
(function($){
       /**
        * @param container 
        * @description якщо вказати контейнер, то елемент буде відцентровуватися
        * відносно цього контейнера, якщо не вказувати нічого, то відносно вікна
        * якщо вказати parent, то відцентрування відносно батьківсього контейнера
        * **********************************************************************
        * $('#someDiv').center('parent'); //відносно батьківського елемента
        * $('#someDiv').center(); відносно вікна
        * $('#someDiv').center($('#anotherDiv')); //відносно іншого елемента
        */ 
       $.fn.center = function(container){
           
           var $this = $(this);
           
           //по дефолту: вся область вікна
           if(arguments.length == 0){
               container = $(window);
           }
           
           if(typeof(container) == 'string'){
               if(container === 'parent'){
                   
                   container = $this.parent();
               }
           }
           
           //console.log($this);
           
        //центр по горизонталі
         var middleWidth = (container.width() / 2) - ($this.width() / 2);
         //центр по вертикалі
         var middleHeight = (container.height() / 2) - ($this.height() / 2);
         
         $this.css({
             marginLeft : middleWidth,
             marginTop : middleHeight
         });
         
         return $this;
           
       }; 
  
})(jQuery);