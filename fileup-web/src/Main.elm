module Main exposing (..)

import Browser
import Html exposing (..)
import Html.Attributes exposing (..)
import Html.Events exposing (..)
import Http
import Json.Decode exposing (Decoder, int, string, bool, field, map2, map3, map4)

-- MAIN
main : Program () Model Msg
main =
  Browser.element
    { init = init
    , update = update
    , subscriptions = always Sub.none
    , view = view
    }


type alias File =
  { id: String,
    filename : String,
    size: Int,
    date: String
  }

type alias Files = List File
-- MODEL

type alias Stat =
    { msg : String,
      error : Bool,
      code : Int
    }

type alias FileResult = (Stat, Files)

type Model
  = Failure Http.Error
  | Loading
  | Success FileResult


init : () -> (Model, Cmd Msg)
init _ = (Loading, listFile)



-- UPDATE


type Msg
  = Refresh
  | GetFileList (Result Http.Error FileResult)
  | DeleteFile String
  | FileDeleted (Result Http.Error FileResult)


update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  case msg of
    Refresh ->
      (Loading, listFile)

    GetFileList result ->
      case result of
        Ok fileResult ->
          (Success fileResult, Cmd.none)
        Err err ->
          (Failure err, Cmd.none)

    DeleteFile id ->
          (model, deleteFile id)

    FileDeleted result ->
      case result of
        Ok _ ->
          (model, listFile)
        Err err ->
          (Failure err, Cmd.none)

-- VIEW
view : Model -> Html Msg
view model =
  div []
    [h2 [] [ text "File Uploader - Web" ]
    , h3 [] [text "Upload"]
    ,input [ type_ "file" ] []
    , viewFiles model

    ]


viewFiles : Model -> Html Msg
viewFiles model =
  case model of
    Failure _ ->
      div [] [text "error"]
    Loading ->
      div []
        [text "Loading..."]
    Success (_, files) ->
        div []
           [ h3 [] [ text "Files" ]
           , div [] [button [type_ "button", onClick (Refresh)] [ text "Refresh files"]]
           , div [] 
             [
               table [] (viewTableHeader:: List.map viewFile files)
             ]
           ]

viewTableHeader : Html Msg
viewTableHeader =
    tr []
        [ th []
            [ text "Name" ]
        , th []
            [text "Size"]
        , th []
            [ text "Uploaded Date" ]
        ]


viewFile : File -> Html Msg
viewFile file =
    tr []
        [ td []
            [ text file.filename ]
        , td []
            [text (String.fromInt file.size)]
        , td []
            [ text file.date ]
        , td []
            [
               button [ type_ "button", onClick (DeleteFile file.id) ]
                [ text "Delete" ]
            ]
        ]
-- HTTP


deleteFile : String -> Cmd Msg
deleteFile id =
    Http.request
        { method = "GET"
        , headers = []
        , url = "http://127.0.0.1:54321/delete?uuid=" ++ id
        , body = Http.emptyBody
        , expect = Http.expectJson FileDeleted fileResultDecoder
        , timeout = Nothing
        , tracker = Nothing
        }

listFile : Cmd Msg
listFile =
  Http.get
    { url = "http://127.0.0.1:54321/list?detailed=true"
    , expect = Http.expectJson GetFileList fileResultDecoder
    }


statDecoder: Decoder Stat
statDecoder = 
  map3 Stat
    (field "msg" string)
    (field "error" bool)
    (field "status" int)

fileDecoder: Decoder File
fileDecoder =
  map4 File
    (field "id" string)
    (field "filename" string)
    (field "size" int)
    (field "uploaddate" string)


fileResultDecoder : Decoder FileResult
fileResultDecoder = 
  map2 Tuple.pair
  (field "meta" statDecoder)
  (field "data" (Json.Decode.list fileDecoder))
