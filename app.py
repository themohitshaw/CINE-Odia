from flask import Flask , render_template , request

app = Flask(__name__)

@app.route('/' , methods = ["GET" , "POST"])
def home():
    if request.method == "POST":
        movie_list = request.form.getlist("movies")
        # print(movie_list)
        new_movie_list = []
        for movie in movie_list:
            movie = movie.strip()
            if movie:
                new_movie_list.append(movie)
        # print(new_movie_list)
    
    return render_template('index.html')
@app.route('/movies')
def movies():
    return render_template('movies.html')
@app.route('/about')
def about():
    return render_template('about.html')

if __name__ == "__main__":
    app.run(debug=True)