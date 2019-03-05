
var ob={};


ob.test = function test(test){
    console.log(test);
}


/**
 *
 * @param allPosts  object
 * @returns {Array} all available tags
 */
ob.allFields   = function allFields(allPosts) {
    var availableTags = [];

    allPosts.forEach(function (post) {
        availableTags.push(post.name, post.author.username,
            post.description.replace(/,/g, '').trim());
        post.comments.forEach(function (comment) {
            availableTags.push(comment.author.username, comment.text.replace(/,/g, '').trim());
        });
    });


    return availableTags;
}

module.exports = ob;