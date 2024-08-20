function getLearnerData(CourseInfo, AssignmentGroups, LearnerSubmissions) {
    // Check if AssignmentGroups belong to the correct course
    AssignmentGroups.forEach(group => {
        if (group.course_id !== CourseInfo.id) {
            throw new Error(`Assignment Group ${group.id} does not belong to the Course ${CourseInfo.id}`);
        }
    });

    // Create a map of assignments for easy lookup by ID
    const assignmentMap = new Map();
    AssignmentGroups.forEach(group => {
        group.assignments.forEach(assignment => {
            assignmentMap.set(assignment.id, {
                ...assignment,
                group_weight: group.group_weight,
            });
        });
    });

    // Create a map to store learner data
    const learnerDataMap = new Map();

    LearnerSubmissions.forEach(submission => {
        const learnerId = submission.learner_id;
        const assignment = assignmentMap.get(submission.assignment_id);

        if (!assignment) {
            console.warn(`Assignment ${submission.assignment_id} not found.`);
            return;
        }

        const dueDate = new Date(assignment.due_at);
        const submittedDate = new Date(submission.submission.submitted_at);

        // Skip assignments not due yet
        if (submittedDate > dueDate) {
            console.warn(`Submission for assignment ${assignment.id} is late.`);
            submission.submission.score -= 0.1 * assignment.points_possible;
        }

        const pointsPossible = assignment.points_possible;
        const groupWeight = assignment.group_weight;

        if (typeof pointsPossible !== "number" || pointsPossible <= 0) {
            console.error(`Invalid points_possible for assignment ${assignment.id}`);
            return;
        }

        const scorePercentage = (submission.submission.score / pointsPossible) * 100;

        if (!learnerDataMap.has(learnerId)) {
            learnerDataMap.set(learnerId, {
                id: learnerId,
                avg: 0,
                totalPoints: 0,
                totalWeight: 0,
            });
        }

        const learnerData = learnerDataMap.get(learnerId);

        // Accumulate the weighted scores and total weights
        learnerData.avg += scorePercentage * groupWeight * pointsPossible;
        learnerData.totalPoints += groupWeight * pointsPossible;
        learnerData.totalWeight += groupWeight;

        // Save individual assignment score
        learnerData[assignment.id] = scorePercentage;
    });

    // Convert the map to an array and calculate the final average
    const learnerResults = [];
    learnerDataMap.forEach(learner => {
        learner.avg = learner.avg / learner.totalPoints;
        delete learner.totalPoints;
        delete learner.totalWeight;
        learnerResults.push(learner);
    });

    return learnerResults;
}
