package com.abetube

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.tooling.preview.Preview
import androidx.core.app.ActivityCompat
import com.google.android.exoplayer2.ExoPlayer
import com.google.android.exoplayer2.MediaItem
import com.google.android.exoplayer2.util.Util
import org.schabi.newpipe.extractor.NewPipe
import org.schabi.newpipe.extractor.StreamingService
import org.schabi.newpipe.extractor.search.SearchExtractor
import org.schabi.newpipe.extractor.services.youtube.YoutubeSearchExtractor
import org.schabi.newpipe.extractor.stream.StreamInfo
import org.schabi.newpipe.extractor.stream.StreamInfoItem
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Search
import androidx.compose.ui.unit.dp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import androidx.compose.runtime.livedata.observeAsState
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            ABETUBETheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ABETUBEApp()
                }
            }
        }
    }
}

@Composable
fun ABETUBEApp() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = "search") {
        composable("search") { SearchScreen() }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(viewModel: SearchViewModel = viewModel()) {
    val context = LocalContext.current
    val searchResults by viewModel.searchResults.observeAsState(emptyList())
    val scope = rememberCoroutineScope()
    var query by remember { mutableStateOf("") }

    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        TextField(
            value = query,
            onValueChange = { query = it },
            label = { Text("חיפוש שירים") },
            leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
            modifier = Modifier.fillMaxWidth()
        )
        Button(
            onClick = {
                scope.launch(Dispatchers.IO) {
                    viewModel.search(query)
                }
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("חפש")
        }
        LazyColumn {
            items(searchResults) { item ->
                SearchItem(item = item, onClick = {
                    // ניגון – להוסיף ExoPlayer כאן
                    val player = ExoPlayer.Builder(context).build()
                    // ... קוד ניגון עם NewPipe
                })
            }
        }
    }
}

@Composable
fun SearchItem(item: StreamInfoItem, onClick: () -> Unit) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth().padding(8.dp)
    ) {
        Text(text = item.name, modifier = Modifier.padding(16.dp))
    }
}

// ViewModel פשוט לחיפוש
class SearchViewModel : ViewModel() {
    val searchResults = MutableLiveData<List<StreamInfoItem>>()

    suspend fun search(query: String) {
        NewPipe.init(StreamingService.getService(0)) // YouTube
        val extractor = YoutubeSearchExtractor()
        extractor.search(query)
        searchResults.postValue(extractor.items)
    }
}

// Theme אדום-שחור
@Composable
fun ABETUBETheme(content: @Composable () -> Unit) {
    val darkColorScheme = darkColorScheme(
        primary = Color(0xFFE53935), // אדום
        background = Color.Black,
        surface = Color(0xFF121212)
    )
    MaterialTheme(
        colorScheme = darkColorScheme,
        content = content
    )
}

@Preview
@Composable
fun PreviewApp() {
    ABETUBEApp()
}
