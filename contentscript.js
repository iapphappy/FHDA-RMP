//De Anza Portal + Rate My professor
var table = document.getElementsByClassName('datadisplaytable')[0];
if (table != null) {
    var myurl = "https://search-production.ratemyprofessors.com/solr/rmp/select/?solrformat=true&rows=2&wt=json&q=";
    var newCell;
    var columnValue = 23;
    var found = false;
    for (var i = 1, row; row = table.rows[i]; i++) {
        if (i == 1) {
            var ratingCell = row.insertCell(row.length);
            ratingCell.innerHTML = "Rating";
            ratingCell.style.fontWeight = "800";
            ratingCell.style.fontSize = "12px";
            ratingCell.style.backgroundColor = "#E9E9E9";
        } else {
            var newCell = row.insertCell(row.length);
			newCell.style.textAlign = "center";
			newCell.style.justifyContent = "flex-end";
        }
        for (var j = 0, col; col = row.cells[j]; j++) {
            if (found && j == columnValue) {
				newCell.style.border = "thin solid grey";
                var professor = col.innerText;
                if (professor.indexOf('(P)') > -1) {
                    var fullName = col.innerText;
                    var splitName = fullName.split(' ');
					if (splitName.length > 3) {
                        var middleName = splitName[1];
                        middleName = middleName.toLowerCase();
						var lastName = splitName[splitName.length-2];
                    } else{
					var lastName = splitName[1];
					}
                    var firstName = splitName[0];
                    lastName = lastName.toLowerCase();
                    lastName = lastName.trim();
                    firstName = firstName.toLowerCase();
					firstName = firstName.trim();
					var school = row.cells[j+2].innerText;
					if(school.indexOf('FH')> -1){
						 myurl1 = myurl + firstName + "+" + lastName + "+AND+schoolid_s%3A1581";
					}else {
						myurl1 = myurl + firstName + "+" + lastName + "+AND+schoolid_s%3A1967";
					}
                    var runAgain = true;
                    //Query Rate My Professor with the professor's name
                    GetProfessorRating(myurl1, newCell, splitName, firstName, middleName, runAgain);
                }
				if(col.innerHTML == "Instructor"){
					newCell.innerHTML = "Rating";
					newCell.style.fontWeight = "800";
					newCell.style.fontSize = "12px";
					newCell.style.borderRightWidth = "0px";
                    newCell.style.border= "";
					newCell.style.backgroundColor = "#E9E9E9";
				}
            }
			if (col.innerHTML == "Instructor") {
                columnValue = j;
                found = true;
			}
        }
    }
}

function GetProfessorRating(myurl1, newCell, splitName, firstName, middleName, runAgain) {

    chrome.runtime.sendMessage({ url: myurl1, type: "profRating" }, function (response) {
        var resp = response.JSONresponse;
        var numFound = resp.response.numFound;
        //Add professor data if found
        if (numFound > 0) {
            var profID = resp.response.docs[0].pk_id;
            var realFirstName = resp.response.docs[0].teacherfirstname_t;
            var realLastName = resp.response.docs[0].teacherlastname_t;
            var profRating = resp.response.docs[0].averageratingscore_rf.toFixed(1);
			newCell.style.borderRightWidth = "3px";
			newCell.style.borderRightColor = getColorForRating(profRating);
            if (profRating != undefined) {
                var profURL = "http://www.ratemyprofessors.com/ShowRatings.jsp?tid=" + profID;
                var link = "<a href=\"" + profURL + "\" target=\"_blank\">" + profRating + "</a>";
				newCell.innerHTML = link;
				var allprofRatingsURL = "https://www.ratemyprofessors.com/paginate/professors/ratings?tid=" + profID + "&page=0&max=20";
                AddTooltip(newCell, allprofRatingsURL, realFirstName, realLastName,profRating);
            } else {
                newCell.innerHTML = "N/A";
            }
        } else {
            newCell.innerHTML = "N/A";
        }
        //Try again with professor's middle name if it didn't work the first time
        if (newCell.innerHTML == "N/A" && splitName.length > 2 && runAgain) {
            runAgain = false;
            GetProfessorRating(myurl1, newCell, splitName, firstName, middleName, runAgain);
        }
    });
}

function AddTooltip(newCell, allprofRatingsURL, realFirstName, realLastName,profRating) {
    chrome.runtime.sendMessage({ url: allprofRatingsURL, type: "tooltip" }, function (response) {
        var resp = response.JSONresponse;
        //Build content for professor tooltip
        var easyRating = 0;
        var wouldTakeAgain = 0;
        var wouldTakeAgainNACount = 0;
        var foundFirstReview = false;
        var firstReview = "";
        for (var i = 0; i < resp.ratings.length; i++) {
            easyRating += resp.ratings[i].rEasy;
            if (resp.ratings[i].rWouldTakeAgain === "Yes") {
                wouldTakeAgain++;
            } else if (resp.ratings[i].rWouldTakeAgain === "N/A") {
                wouldTakeAgainNACount++;
            }
			if (resp.ratings[i].rClass) {
                firstReview = resp.ratings[i].rComments;
                foundFirstReview = true;
            }
        }
        if (!foundFirstReview) {
            firstReview = "N/A";
        }
        easyRating /= resp.ratings.length;
        if (resp.ratings.length >= 8 && wouldTakeAgainNACount < (resp.ratings.length / 2)) {
            wouldTakeAgain = ((wouldTakeAgain / (resp.ratings.length - wouldTakeAgainNACount)) * 100).toFixed(0).toString() + "%";
        } else {
            wouldTakeAgain = "N/A";
        }
        var div = document.createElement("div");
        var title = document.createElement("h3");
        title.textContent = "Professor Details";
        var professorText = document.createElement("p");
        professorText.textContent = "Professor Name: " + realFirstName + " " + realLastName;
        var easyRatingText = document.createElement("p");
        easyRatingText.textContent = "Difficulty" + ": " + easyRating.toFixed(1).toString();
		var ratingText = document.createElement("p");
		ratingText.textContent = "Overall Rating: " + profRating.toString();
		var circle = document.createElement("aside");
		circle.classList.add('circle');
		circle.style.backgroundColor = getColorForRating(6.5-easyRating);
		var circle2 = document.createElement("aside");
		circle2.classList.add('circle');
		console.log(easyRating);
		circle2.style.backgroundColor = getColorForRating(profRating);
		circle2.style.right = "283px"
        var wouldTakeAgainText = document.createElement("p");
        wouldTakeAgainText.textContent = "Would take again: " + wouldTakeAgain;
        var commentText = document.createElement("p");
        commentText.textContent = firstReview;
        commentText.classList.add('paragraph');
        div.appendChild(title);
        div.appendChild(professorText);
		div.appendChild(circle2);
		div.appendChild(ratingText);
		div.appendChild(circle);
        div.appendChild(easyRatingText);
        div.appendChild(wouldTakeAgainText);
        div.appendChild(commentText);
        newCell.class = "tooltip";
        newCell.addEventListener("mouseenter", function () {
            //Only create tooltip once
            if (!$(newCell).hasClass('tooltipstered')) {
                $(this).tooltipster({
                        animation: 'grow',
                        theme: 'tooltipster-' + 'default',
                        side: 'left',
                        content: div,
                        delay: 100,
						arrow: false,
						width: 100
                    })
                    .tooltipster('show');
            }
        });
    });
}
function getColorForRating(rating) {
    return (rating >= 3.9|| rating == 0) ? '#20B2AA' : (rating > 3) ? '#FFA500' : '#DC143C';
}
//MediumSeaGreen #2ecc71

//border-color: #6495ED
