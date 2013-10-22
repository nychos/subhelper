/**
 * @description Клас для роботи з localStorage
 * @author nychka08@yandex.ua
 */

function Storage() {

    var self = this;
    
    this.save = function(name, data){
        this.remove(name);
        if(data instanceof Array){
            var data = JSON.stringify(data);
        }else {//if(data instanceof Object){
            var arr = new Array(data);
            var data = JSON.stringify(arr);
        }
        localStorage.setItem(name, data);
    },
    /**
     * Добавляє елемент до існуючого масиву
     * @param {String} name
     * @param {Obj || Array} data
     */
    this.add = function(name, data){
        if(this.isDataInStorage(name)){
            var arr = this.get(name);
           
            if(this.checkItem(name, data.id) === false){
                arr.push(data);
                this.save(name, arr);
                //console.log("failed");
            }else {
                //console.log("already exists");
            }
        }else {
            this.save(name, data);
        }
    },
    /**
     * Витягує дані по ідентифікатору, подібно до таблиць в sql:
     * select * from name where id = id
     * @param {String} name
     * @param {String} id
     * @returns {Boolean}
     */
    this.checkItem = function(name, id){
        var arr = this.get(name);
        for(var i in arr){
            //console.log(arr[i].id + " - " + id);
               if(arr[i].id === id){
                   return arr[i];
               }
        }
        return false;
    },
    /**
     * Отримує дані зі сховища, повертає об'єкт або строку в залежності
     * від того, що записували
     * @param {String} name
     * @returns object or string depending on format of data
     */
    this.get = function(name) {
        
        if(arguments.length == 0){
            return window.localStorage;
        }
        if (this.isDataInStorage(name)) {

            try {
                var result = $.parseJSON(localStorage.getItem(name));
            } catch (e) {

                if (result != undefined || result != null) {
                    throw new Error("result is undefined");
                } else {
                    var result = localStorage.getItem(name);
                }
            } finally {
                return result;
            }
        } else {
            //throw new Error('Data name is wrong. Check it again');
            return false;
        }
    },
    /**
     * Видаляє дані зі сховища
     * @param {String} data
     * 
     */
    this.remove = function(name) {

        if(this.isDataInStorage(name)) {
            localStorage.removeItem(name);
            return true;
        }
        return false;
    },
    /**
     * Перевіряє чи дані уже є в сховищі
     * 
     * @param {String} name
     * @returns {Boolean}
     */
    this.isDataInStorage = function(name){

        if (name == null || name == 'undefined' || null == '')
            throw new Error('name is undefined');
        if (localStorage.getItem(name) != undefined) {
            return true;
        } else {
            return false;
        }
    }
}


