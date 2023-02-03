
const categories = [
    [1,"Arts & Entertainment"],
    [2,"Catechesis"],
    [3,"Charity & Causes"],
    [4,"Conference"],
    [5,"Evangelisation"],
    [6,"Games"],
    [7,"Holy Mass"],
    [8,"Family & Education"],
    [9,"Festivals"],
    [10,"Film & Theatre"],
    [11,"Food & Drinks"],
    [12,"Formation"],
    [13,"Literature"],
    [14,"NFP"],
    [15,"Music"],
    [16,"Party"],
    [17,"Politics & Debate"],
    [18,"Prayer Groups"],
    [19,"Retreat"],
    [20,"Sacraments"],
    [21,"Spiritual Development"],
    [22,"Sports"],
    [23,"Tour"],
    [24,"Travel & Outdoors"],
    [25,"Vigils"],
    [26,"Other"],
    [27,"Pilgrimage"],
    ];


const listCategories =  () => {
    const categoryForCombo = categories.map(item => {return ({ "label": item[1], "id": item[0] })}
    )
    return (categoryForCombo)
}

const listCategoriesNames =  () => {
    const categoryForCombo = categories.map(item =>  item[1])
    return (categoryForCombo)
}

