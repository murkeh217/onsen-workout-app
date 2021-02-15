/***********************************************************************************
 * App Services. This contains the logic of the application organised in modules/objects. *
 ***********************************************************************************/

myApp.services = {

  /////////////////
  // Task Service //
  /////////////////
  tasks: {

    // Creates a new task and attaches it to the pending task list.
    create: function(data) {
      // Task item template.
      var taskItem = ons.createElement(
        '<ons-list-item tappable category="' + myApp.services.categories.parseId(data.category)+ '">' +
          '<label class="left">' +
           '<ons-checkbox></ons-checkbox>' +
          '</label>' +
          '<div class="center">' +
            data.title +
          '</div>' +
          '<div class="right">' +
            '<ons-icon style="color: grey; padding-left: 4px" icon="ion-ios-trash-outline, material:md-delete"></ons-icon>' +
          '</div>' +
        '</ons-list-item>'
      );

      // Store data within the element.
      taskItem.data = data;

      // Add 'completion' functionality when the checkbox changes.
      taskItem.data.onCheckboxChange = function(event) {
        myApp.services.animators.swipe(taskItem, function() {
          var listId = (taskItem.parentElement.id === 'pending-list' && event.target.checked) ? '#completed-list' : '#pending-list';
          document.querySelector(listId).appendChild(taskItem);
        });
      };

      taskItem.addEventListener('change', taskItem.data.onCheckboxChange);

      // Add button functionality to remove a task.
      taskItem.querySelector('.right').onclick = function() {
        myApp.services.tasks.remove(taskItem);
      };

      // Add functionality to push 'details_task.html' page with the current element as a parameter.
      taskItem.querySelector('.center').onclick = function() {
        document.querySelector('#myNavigator')
          .pushPage('html/details_task.html',
            {
              animation: 'lift',
              data: {
                element: taskItem
              }
            }
          );
      };

      // Check if it's necessary to create new categories for this item.
      myApp.services.categories.updateAdd(taskItem.data.category);

      // Add the highlight if necessary.
      if (taskItem.data.highlight) {
        taskItem.classList.add('highlight');
      }

      // Insert urgent tasks at the top and non urgent tasks at the bottom.
      var pendingList = document.querySelector('#pending-list');
      pendingList.insertBefore(taskItem, taskItem.data.urgent ? pendingList.firstChild : null);
    },

    // Modifies the inner data and current view of an existing task.
    update: function(taskItem, data) {
      if (data.title !== taskItem.data.title) {
        // Update title view.
        taskItem.querySelector('.center').innerHTML = data.title;
      }

      if (data.category !== taskItem.data.category) {
        // Modify the item before updating categories.
        taskItem.setAttribute('category', myApp.services.categories.parseId(data.category));
        // Check if it's necessary to create new categories.
        myApp.services.categories.updateAdd(data.category);
        // Check if it's necessary to remove empty categories.
        myApp.services.categories.updateRemove(taskItem.data.category);

      }

      // Add or remove the highlight.
      taskItem.classList[data.highlight ? 'add' : 'remove']('highlight');

      // Store the new data within the element.
      taskItem.data = data;
    },

    // Deletes a task item and its listeners.
    remove: function(taskItem) {
      taskItem.removeEventListener('change', taskItem.data.onCheckboxChange);

      myApp.services.animators.remove(taskItem, function() {
        // Remove the item before updating the categories.
        taskItem.remove();
        // Check if the category has no items and remove it in that case.
        myApp.services.categories.updateRemove(taskItem.data.category);
      });
    }
  },

  /////////////////////
  // Category Service //
  ////////////////////
  categories: {

    // Creates a new category and attaches it to the custom category list.
    create: function(categoryLabel) {
      var categoryId = myApp.services.categories.parseId(categoryLabel);

      // Category item template.
      var categoryItem = ons.createElement(
        '<ons-list-item tappable category-id="' + categoryId + '">' +
          '<div class="left">' +
            '<ons-radio name="categoryGroup" input-id="radio-'  + categoryId + '"></ons-radio>' +
          '</div>' +
          '<label class="center" for="radio-' + categoryId + '">' +
            (categoryLabel || 'No category') +
          '</label>' +
        '</ons-list-item>'
      );

      // Adds filtering functionality to this category item.
      myApp.services.categories.bindOnCheckboxChange(categoryItem);

      // Attach the new category to the corresponding list.
      document.querySelector('#custom-category-list').appendChild(categoryItem);
    },

    // On task creation/update, updates the category list adding new categories if needed.
    updateAdd: function(categoryLabel) {
      var categoryId = myApp.services.categories.parseId(categoryLabel);
      var categoryItem = document.querySelector('#menuPage ons-list-item[category-id="' + categoryId + '"]');

      if (!categoryItem) {
        // If the category doesn't exist already, create it.
        myApp.services.categories.create(categoryLabel);
      }
    },

    // On task deletion/update, updates the category list removing categories without tasks if needed.
    updateRemove: function(categoryLabel) {
      var categoryId = myApp.services.categories.parseId(categoryLabel);
      var categoryItem = document.querySelector('#tabbarPage ons-list-item[category="' + categoryId + '"]');

      if (!categoryItem) {
        // If there are no tasks under this category, remove it.
        myApp.services.categories.remove(document.querySelector('#custom-category-list ons-list-item[category-id="' + categoryId + '"]'));
      }
    },

    // Deletes a category item and its listeners.
    remove: function(categoryItem) {
      if (categoryItem) {
        // Remove listeners and the item itself.
        categoryItem.removeEventListener('change', categoryItem.updateCategoryView);
        categoryItem.remove();
      }
    },

    // Adds filtering functionality to a category item.
    bindOnCheckboxChange: function(categoryItem) {
      var categoryId = categoryItem.getAttribute('category-id');
      var allItems = categoryId === null;

      categoryItem.updateCategoryView = function() {
        var query = '[category="' + (categoryId || '') + '"]';

        var taskItems = document.querySelectorAll('#tabbarPage ons-list-item');
        for (var i = 0; i < taskItems.length; i++) {
          taskItems[i].style.display = (allItems || taskItems[i].getAttribute('category') === categoryId) ? '' : 'none';
        }
      };

      categoryItem.addEventListener('change', categoryItem.updateCategoryView);
    },

    // Transforms a category name into a valid id.
    parseId: function(categoryLabel) {
      return categoryLabel ? categoryLabel.replace(/\s\s+/g, ' ').toLowerCase() : '';
    }
  },

  //////////////////////
  // Animation Service //
  /////////////////////
  animators: {

    // Swipe animation for task completion.
    swipe: function(listItem, callback) {
      var animation = (listItem.parentElement.id === 'pending-list') ? 'animation-swipe-right' : 'animation-swipe-left';
      listItem.classList.add('hide-children');
      listItem.classList.add(animation);

      setTimeout(function() {
        listItem.classList.remove(animation);
        listItem.classList.remove('hide-children');
        callback();
      }, 950);
    },

    // Remove animation for task deletion.
    remove: function(listItem, callback) {
      listItem.classList.add('animation-remove');
      listItem.classList.add('hide-children');

      setTimeout(function() {
        callback();
      }, 750);
    }
  },

  ////////////////////////
  // Initial Data Service //
  ////////////////////////
  fixtures: [
    {
      title: '3-5 min Jog',
      category: 'Warm-Up Routine',
      description: 'Jog at one place or move around',
      highlight: false,
      urgent: false
    },
    {
      title: '10 Forward & Backward Lunges',
      category: 'Warm-Up Routine',
      description: 'Balance and form necessary',
      highlight: false,
      urgent: false
    },
    {
      title: '10m High Knees',
      category: 'Warm-Up Routine',
      description: 'At one place or move around',
      highlight: false,
      urgent: false
    },
    {
      title: '10m 4 Way QM',
      category: 'Warm-Up Routine',
      description: 'Do all four directions quadruple movement',
      highlight: false,
      urgent: false
    },
    {
      title: '10m Left & Right Karaoke',
      category: 'Warm-Up Routine',
      description: 'Do it with swag',
      highlight: false,
      urgent: false
    },
    {
      title: '10m Broad Jump Push Ups',
      category: 'Warm-Up Routine',
      description: 'Jump and Pushup',
      highlight: false,
      urgent: false
    },
    {
      title: 'Wrist, Elbow, Arm Rotations',
      category: 'Warm-Up Routine',
      description: 'Arm rotations have 4 range',
      highlight: false,
      urgent: false
    },
    {
      title: 'Hip Circles',
      category: 'Warm-Up Routine',
      description: 'Clockwise and Anticlockwise',
      highlight: false,
      urgent: false
    },
    {
      title: 'Knees Together, Knees Apart, Ankle Rotations',
      category: 'Warm-Up Routine',
      description: 'Clockwise and Anticlockwise',
      highlight: false,
      urgent: false
    },
    
    {
      title: 'Sitting Ham String Stretch',
      category: 'Stretch Routine',
      description: 'Sitting toe touch',
      highlight: false,
      urgent: false
    },
    {
      title: 'Left & Right Ham String Stretch',
      category: 'Stretch Routine',
      description: 'Bend one leg in and straighten one leg. Touch toes',
      highlight: false,
      urgent: false
    },
    {
      title: 'Cross Over Hip Stretch (Both Sides)',
      category: 'Stretch Routine',
      description: 'Lay on your back , arms extended out to the sides, lift one leg and cross over other leg, have a 90 degree bend in crossing over leg and touch the ground, keep both shoulders on the ground',
      highlight: false,
      urgent: false
    },
    {
      title: 'Butterfly Stretch',
      category: 'Stretch Routine',
      description: 'Bend both legs in, have the soles of your feet touching in the middle, use your elbows to try and press both knees to touch the ground',
      highlight: false,
      urgent: false
    },
    {
      title: 'Left & Right Side Quad Stretch',
      category: 'Stretch Routine',
      description: 'Lay down on back, turn to one side, bend and hold other leg back and stretch the quad',
      highlight: false,
      urgent: false
    },
    {
      title: 'Standard Split Stretch',
      category: 'Stretch Routine',
      description: 'Splits, stand up and slowly start to split your legs to the out sides of your shoulders, place your hands on the ground or on an obstacle in front of you for extra support.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Sitting Split Hamstring Stretch',
      category: 'Stretch Routine',
      description: 'Sit down on your butt, split your legs and lean forward, keep your back straight, and try and touch the floor with your head and chest.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Sitting Split Left & Right Stretch',
      category: 'Stretch Routine',
      description: 'In split position, lean towards either sides',
      highlight: false,
      urgent: false
    },
    {
      title: 'Left Hip Flexor',
      category: 'Stretch Routine',
      description: 'Kneel down with your left knee on the ground and your right leg bent at 90 degrees and foot in front on the ground, keep your back straight and push forward with your left hip.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Right Hip Flexor',
      category: 'Stretch Routine',
      description: 'Kneel down with your right knee on the ground and your left leg bent at 90 degrees and foot in front on the ground, keep your back straight and push forward with your right hip.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Kneeling Left Hamstring',
      category: 'Stretch Routine',
      description: 'From the same kneeling position but instead of having the left leg bent you are going to have it extended, keep your back straight, lean forward, and try and touch your left toes.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Kneeling Right Hamstring',
      category: 'Stretch Routine',
      description: 'From the same kneeling position but instead of having the right leg bent you are going to have it extended, keep your back straight, lean forward, and try and touch your right toes.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Left Calf Stretch',
      category: 'Stretch Routine',
      description: 'From the same kneeling position but instead of having the left leg bent you are going to have it extended, keep your back straight, lean forward, and try and touch your left toes.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Right Calf Stretch',
      category: 'Stretch Routine',
      description: 'From the same kneeling position but instead of having the left leg bent you are going to have it extended, keep your back straight, lean forward, and try and touch your left toes.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Left Forearm Stretch',
      category: 'Stretch Routine',
      description: 'Extend your left arm out with your palm facing up, grab your left hand with your right hand, and pull the left hand down and toward you while keeping the left arm extended.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Right Forearm Stretch',
      category: 'Stretch Routine',
      description: 'Extend your right arm out with your palm facing up, grab your right hand with your left hand, and pull the right hand down and toward you while keeping the right arm extended.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Left Arm Across Stretch',
      category: 'Stretch Routine',
      description: 'Extend the left arm in front of you with the palm facing down, reach under your left arm with your right hand and grab your left elbow, while keeping your left arm straight pull your left arm across your body and into toward your right shoulder.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Right Arm Across Stretch',
      category: 'Stretch Routine',
      description: 'Extend the right arm in front of you with the palm facing down, reach under your right arm with your left hand and grab your right elbow, while keeping your right arm straight pull your right arm across your body and into toward your left shoulder.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Kneeling Reach Forward Stretch',
      category: 'Stretch Routine',
      description: 'Sit with your knees on the ground and reach forward with your hands, have your head fall forward and push your rear towards your feet, use your hands and fingers to walk your arms forward and extend this stretch, and dont lift your backside off your feet.',
      highlight: false,
      urgent: false
    },
    {
      title: 'Rising Stomach Stretch',
      category: 'Stretch Routine',
      description: 'Lay on the ground then lift your upper body off the ground with your arms keeping your hips on the ground. Straighten your arms, look straight ahead, and arch your back.',
      highlight: false,
      urgent: false
    },

  

    {
      title: '5 min Both Feet Perpendicular On Rail',
      category: 'Balancing Routine',
      description: 'Can use any rail like structure',
      highlight: false,
      urgent: false
    },
  ]
};
