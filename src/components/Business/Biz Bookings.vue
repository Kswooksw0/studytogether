<template>
<div id="biz bookings">
    <app-header></app-header>
    <h1 id="title">Bookings</h1>
    <br><br>
    <div id="mybizbookings">
        <ul>
            <!-- E.g bookings = ['dateObject', '18 Apr 2021', [ ['Jermaine',3,['0700 - 0800', '1300 - 1500']], ['Jared',5, ['1100 - 1200']] ] ] -->
            <li v-for="booking in bookings" :key="booking.index">
                <!-- date of coming -->
                <!-- E.g 18 Apr 2021  -->
                <div id="dateComing">
                    {{booking[1]}}
                </div>
                <hr>
                <!-- iterations of all customers coming on that date -->
                <div>
                    <ul class="customers">
                        <!-- booking[2] == [ ['Jermaine',3,['0700 - 0800', '1300 - 1500']], ['Jared',5, ['1100 - 1200']] ] -->
                        <li id="customer" v-for="customer in booking[2]" :key="customer.index">
                            <!-- customer name and pax -->
                            <!-- 'Jermaine' (pax: 3) -->
                            <div id="customerName">{{customer[0]}}  (pax: {{customer[1]}})  </div>
                            <br>
                            <ul>
                                <!-- customer[2] == ['0700 - 0800', '1300 - 1500'] -->
                                <li v-for="interval in customer[2]" :key="interval.index">
                                    <!-- '0700 - 0800' -->
                                    {{interval}}
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import Header from '/src/components/UI/Header.vue';
import firebase from 'firebase';
import database from '/src/firebase.js';

export default {

    data() {
        return {
            bookings: [],
            timeslots: []
        }
    },

    methods: {

        getDoc: async function() {
            // hardcode
            // var userId = "fo2v2d2wA8Q2k3tXlt8hTxiRUcs2"
            
            // CurrentUSer.uid == listing doc ID
            var userId = firebase.auth().currentUser.uid
            var arr = []
            await database.collection('listings').doc(userId).collection('timeslots').get().then(querySnapShot => {
                let slot = {}
                querySnapShot.docs.forEach(doc => {
                    slot = {['id']: doc.id}
                    arr.push(slot)
                })
            })
            return arr
        },

        fetchItems: async function() {
            this.timeslots = await this.getDoc()
            var listOfBookings = []
           // function to sort the dates in order, most immedate date coming first
            function sortByDate(a, b) {
                if (a[0] == b[0]) {
                    return 0;
                } else {
                    return (a[0] < b[0]) ? -1 : 1;
                }
            }
            // sorts the timings, with ealiest timing coming first. 
            // E.g [1100 - 1200, 0800 - 0900] into [0800 - 0900, 1100 - 1200]
            function sortByTiming(a, b) {
                if (Number(a.slice(0,2)) == Number(b.slice(0,2))) {
                    return 0;
                } else {
                    return (Number(a.slice(0,2)) < Number(b.slice(0,2))) ? -1 : 1;
                }
            }
            // segments the timings into intervals. 
            // E.g [1100 - 1200, 1200 - 1300, 1400 - 1500] into [1100 - 1300, 1400 - 1500]
            function segmentToIntervals(arr) {
                var intervals = []
                var currTime = arr[0].slice(0,4)

                for (var i = 0; i < arr.length; i++) {
                    if (i == arr.length - 1) {
                        currTime = currTime + ' - ' + arr[i].slice(-4)
                        intervals.push(currTime)
                    } else if (arr[i].slice(-4) != arr[i + 1].slice(0,4)) {
                        currTime = currTime + ' - ' + arr[i].slice(-4)
                        intervals.push(currTime)
                        currTime = arr[i + 1].slice(0,4)
                    } else {
                        continue
                    }
                }
                return intervals
            }

            this.timeslots.forEach(async function(slot) {
                // E.g '170421'
                let timeslot = slot['id']
                // 17
                let day = timeslot.slice(0,2) 
                // 04
                let month = timeslot.slice(2,4) 
                // 21
                let year = timeslot.slice(4,6) 
                //  '2021-04-17'
                let dateInput = '20' + year + '-' + month + '-' + day
                // logic to achieve date domain
                let dateObj = new Date(dateInput)
                let dateObj_copy = new Date(dateInput)
                dateObj_copy.setHours(dateObj_copy.getHours() - 8);
               
                let dateObjdayForward = new Date(dateObj.getTime())
                dateObjdayForward.setDate(dateObjdayForward.getDate() + 1)
                dateObjdayForward.setHours(dateObjdayForward.getHours() - 8)
                // lower limit of the date domain 
                // E.g 18 Apr 2021 00:00:00
                let timeObj = firebase.firestore.Timestamp.fromDate(dateObj_copy)
                // upper limit of the date domain
                // E.g 19 Apr 2021 00:00:00
                let timeObjLimit = firebase.firestore.Timestamp.fromDate(dateObjdayForward)

                let outputDate = dateObj.toDateString()
                let outputDay = outputDate.slice(-7,-5)
                let outputYear = outputDate.slice(-4)
                let outputMonth = outputDate.slice(-11,-8)
                // E.g '18 Apr 2021'
                let date = outputDay + ' ' + outputMonth + ' ' + outputYear
                // E.g 'Apr 18 2021'
                let dateToCompare = outputMonth + ' ' + outputDay + ' ' + outputYear
                // get current date to string. E.g Sun Apr 18 2021
                let currentDate = new Date().toDateString()
                // E.g Apr 18 2021
                let currentDateWithoutDayOfWeek = currentDate.substr(currentDate.indexOf(' ') + 1)
                // collects details of all customers coming on the date which falls between startDate and endDate (the date domain)
                async function getNames(startDate, endDate) {
                    var customerinfos = []
                        await database.collection('bookings').where("date", ">=", startDate).where("date", "<", endDate).get().then((querySnapShot) => {
                            console.log(startDate.toDate().toDateString())
                            querySnapShot.docs.forEach(async function(doc) {
                                let data = doc.data()
                                let customerName = data['name']
                                let time = data['time']
                                // sort the timings in order, starting from the earliest timing
                                time = time.sort(sortByTiming)
                                // then segment them into intervals
                                let duration = segmentToIntervals(time)
                                let pax = data['pax']
                                let customer = [customerName, pax, duration]
                                customerinfos.push(customer)
                            })
                        })
                    return customerinfos
                }
                let customersDetails = await getNames(timeObj, timeObjLimit)
                // only add each booking to the array if there are customer details and the date of coming 
                // is either today or tomorrow onwards
                if(customersDetails.length != 0 && (dateToCompare == currentDateWithoutDayOfWeek || new Date() < new Date(dateInput))) {
                    let booking = [dateObj, date, customersDetails]
                    listOfBookings.push(booking)
                    listOfBookings.sort(sortByDate)
                }
            })
            this.bookings = listOfBookings
        }
    },

    created: function() {
        this.fetchItems()
    },

    components: {
        'app-header': Header
    }
}
</script>

<style scoped>

#title {
    position: relative;
    text-align: center;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    font-size: 40px;
}

#mybizbookings {
    font-size: 20px;
}

#mybizbookings ul {
    list-style-type: none; 
}

#mybizbookings li {
    font-size:25px;
    border: 5px solid #d6d6d6;
    border-radius: 25px;
    height: 100%;
    width: 45%;
    padding: 10px;
    margin: auto;
    margin-bottom: 30px;
    background-color: #ebebeb;
}

#mybizbookings #dateComing {
    font-size: 30px;
    font-family: Verdana, Geneva, Tahoma, sans-serif;
}

#mybizbookings hr {
  display: block;
  margin-top: 0.5em;
  margin-bottom: 0.5em;
  margin-left: auto;
  margin-right: auto;
  border-style: inset;
  border-width: 1px;
  width: 90%;
  height: 12px;
  border: 0;
  box-shadow: inset 0 12px 12px -12px rgba(0, 0, 0, 0.5);
}

#mybizbookings #customer {
    font-family: Verdana, Geneva, Tahoma, sans-serif;
    font-size: 20px;
    border: none;
    height: 100%;
    width: 70%;
    padding: 5px;
    margin: auto;
    margin-bottom: 30px;
    background-color: #ebebeb;
}

#customerName {
    font-size: 22px;
}
</style>
