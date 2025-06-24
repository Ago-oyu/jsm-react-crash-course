import { useEffect, useState } from "react"
import { useDebounce } from "react-use"
import Search from "./components/Search"
import Spinner from "./components/Spinner"
import MovieCard from "./components/MovieCard"
import { getTrendingMovies, updateSearchCount } from "./appwrite"

const API_BASE_URL = "https://api.themoviedb.org/3"

const API_KEY = import.meta.env.VITE_TMDB_API_KEY

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/JSON",
    Authorization: `Bearer ${API_KEY}`
  }
}

function App() {
  const [searchTerm, setSearchTerm] = useState("")

  const [errorMessage, setErrorMessage] = useState("")

  const [moviesList, setMoviesList] = useState([])

  const [trendingMovies, setTrendingMovies] = useState([])

  const [isLoading, setIsLoading] = useState(false)

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')

  useDebounce(() => {
    setDebouncedSearchTerm(searchTerm)
  }, 500, [searchTerm])

  const fetchMovies = async (query = '') => {
    setIsLoading(true)
    setErrorMessage("")

    try {
      const endpoint = query ?
        `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`

      const response = await fetch(endpoint, API_OPTIONS)

      if (!response.ok) {
        throw new Error("Failed to fetch movies")
      }

      const data = await response.json()

      if (data.result === 'False') {
        setErrorMessage(data.error || "failed to fecth movies")
        setMoviesList([])
        return
      }
      console.log(data);

      if (query != '' && data.results.length > 0) {
        console.log('updateSearchCount');
        await updateSearchCount(query, data.results[0])
      }
      setMoviesList(data.results || [])
    } catch (error) {
      console.log(`Error fetching movies: ${error}`);
      setErrorMessage(error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadTrendingMovies = async () => {
    try {
      const result = await getTrendingMovies()
      console.log(result);
      setTrendingMovies(result)
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
      // setErrorMessage('Error fetching trending movies')
    }
  }

  useEffect(() => {
    fetchMovies(debouncedSearchTerm)
  }, [debouncedSearchTerm])

  useEffect(() => {
    loadTrendingMovies()
  }, [])

  return (
    <main>
      <div className="pattern"></div>

      <div className="wrapper">
        <header>
          <img src="./hero.png" />
          <h1>Find <span className="text-gradient">Movies</span>  You'll Enjoy Without Hasle</h1>
          <Search searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>

            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {moviesList.map(movie => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  )
}

export default App
